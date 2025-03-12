const bunyan = require('bunyan');
const got = require('got');

const {
  BITBUCKET_USERNAME,
  BITBUCKET_PASSWORD,
  BITBUCKET_WORKSPACE,
  RENOVATE_BOT_USER,
} = process.env;
const MANUAL_MERGE_MESSAGE = 'merge this manually';
const AUTO_MERGE_MESSAGE = '**Automerge**: Enabled.';

const DEFAULT_OPTIONS = {
  prefixUrl: 'https://api.bitbucket.org',
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

function isAutomerging(pr) {
  try {
    return (
      pr.description.includes(AUTO_MERGE_MESSAGE) &&
      !pr.description.includes(MANUAL_MERGE_MESSAGE)
    );
  } catch (error) {
    log.error(error);
    return false;
  }
}

function getPullRequests() {
  const prEndpoint = `/2.0/workspaces/${BITBUCKET_WORKSPACE}/pullrequests/${RENOVATE_BOT_USER}`;
  log.info('Requesting %s%s...', DEFAULT_OPTIONS.prefixUrl, prEndpoint);

  return got.paginate('', {
    ...DEFAULT_OPTIONS,
    pathname: prEndpoint,
    pagination: {
      transform: (response) =>
        response.body.values
          .filter((pr) => isAutomerging(pr))
          .map((pr) => pr.links.self.href),
      paginate: (response) => {
        if ('next' in response.body && response.body.next !== '') {
          log.info('Requesting %s...', response.body.next);
          return {
            url: new URL(response.body.next),
          };
        }
        log.info('All pull-requests gathered.');
        return false;
      },
    },
  });
}

function approvePullRequest(prHref) {
  return got('', {
    ...DEFAULT_OPTIONS,
    prefixUrl: `${prHref}/approve`,
    method: 'POST',
    throwHttpErrors: false,
  });
}

async function main() {
  if (
    !BITBUCKET_USERNAME ||
    !BITBUCKET_PASSWORD ||
    !BITBUCKET_WORKSPACE ||
    !RENOVATE_BOT_USER
  ) {
    log.fatal(
      'At least one of BITBUCKET_USERNAME, BITBUCKET_PASSWORD, BITBUCKET_WORKSPACE, RENOVATE_BOT_USER environement variables is not set.'
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
            if ('error' in response.body && 'message' in response.body.error) {
              log.info(
                { pr: prHref, res: response },
                response.body.error.message
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
