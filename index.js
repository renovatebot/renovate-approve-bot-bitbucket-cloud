const bunyan = require('bunyan');
const got = require('got');

const {
  BITBUCKET_URL,
  BITBUCKET_USERNAME,
  BITBUCKET_PASSWORD,
  RENOVATE_BOT_USER,
} = process.env;
const MANUAL_MERGE_MESSAGE = 'merge this manually';

const DEFAULT_OPTIONS = {
  prefixUrl: BITBUCKET_URL,
  // If we use username/password options, they will be URL encoded
  // https://github.com/sindresorhus/got/issues/1169
  // https://github.com/nodejs/node/issues/31439
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${BITBUCKET_USERNAME}:${BITBUCKET_PASSWORD}`
    ).toString('base64')}`,
  },
  responseType: 'json',
};

const log = bunyan.createLogger({
  name: 'renovate-approve-bot',
  serializers: {
    res: bunyan.stdSerializers.res,
  },
});

function isCreatedByRenovateBot(pr) {
  try {
    return pr.author.user.slug === RENOVATE_BOT_USER;
  } catch (error) {
    log.error(error);
    return false;
  }
}

function isAutomerging(pr) {
  try {
    return !pr.description.includes(MANUAL_MERGE_MESSAGE);
  } catch (error) {
    log.error(error);
    return false;
  }
}

function extractApiUrl(pr) {
  for (const link of pr.links.self) {
    const match = link.href.match(
      /\/((?:projects|users)\/\S+\/repos\/\S+\/pull-requests\/\d+)/
    );

    if (match) {
      return `${BITBUCKET_URL}/rest/api/1.0/${match[1]}`;
    }
  }

  throw new Error(`Could not extract API URL for ${pr.links.self[0].href}`);
}

function getPullRequests() {
  const prEndpoint = 'rest/api/1.0/dashboard/pull-requests';
  log.info('Requesting %s%s...', prEndpoint);

  return got.paginate(prEndpoint, {
    ...DEFAULT_OPTIONS,
    searchParams: {
      role: 'REVIEWER',
      state: 'OPEN',
    },
    pagination: {
      transform: (response) =>
        response.body.values
          .filter((pr) => isCreatedByRenovateBot(pr))
          .filter((pr) => isAutomerging(pr))
          .map((pr) => extractApiUrl(pr)),
      paginate: (response) => {
        if ('isLastPage' in response.body && !response.body.isLastPage) {
          return {
            searchParams: {
              start: response.body.nextPageStart,
            },
          };
        }

        log.info('All pull-requests gathered.');
        return false;
      },
    },
  });
}

function approvePullRequest(prHref) {
  return got(`participants/${BITBUCKET_USERNAME}`, {
    ...DEFAULT_OPTIONS,
    prefixUrl: prHref,
    method: 'PUT',
    throwHttpErrors: false,
    json: {
      status: 'APPROVED',
    },
  });
}

async function main() {
  if (
    !BITBUCKET_URL ||
    !BITBUCKET_USERNAME ||
    !BITBUCKET_PASSWORD ||
    !RENOVATE_BOT_USER
  ) {
    log.fatal(
      'At least one of BITBUCKET_URL, BITBUCKET_USERNAME, BITBUCKET_PASSWORD, RENOVATE_BOT_USER environement variables is not set.'
    );
    process.exit(1);
  }

  let prHrefs;
  try {
    prHrefs = await getPullRequests();
  } catch (error) {
    log.fatal(error);
    process.exit(1);
  }

  for await (const prHref of prHrefs) {
    log.info('Approving: %s', prHref);
    approvePullRequest(prHref)
      .then((response) => {
        switch (response.statusCode) {
          case 200:
            log.info({ pr: prHref, res: response }, 'Approved');
            break;
          case 409:
            // likely already approved
            if (
              'errors' in response.body &&
              'message' in response.body.errors[0]
            ) {
              log.info(
                { pr: prHref, res: response },
                response.body.errors[0].message
              );
            } else {
              log.error({ pr: prHref, res: response }, response.body);
            }
            break;
          default:
            log.error({ pr: prHref, res: response }, response.body);
            break;
        }
        return response;
      })
      .catch((error) => log.error(error, { pr: prHref }));
  }
}

if (require.main === module) {
  main();
}
