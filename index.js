const bunyan = require('bunyan');

const BitbucketCloudAdapter = require('./adapter/bitbucket-cloud');
const BitbucketDataCenterAdapter = require('./adapter/bitbucket-data-center');

const {
  BITBUCKET_URL,
  BITBUCKET_USERNAME,
  BITBUCKET_PASSWORD,
  RENOVATE_BOT_USER,
} = process.env;

const DEFAULT_ADAPTER_OPTIONS = {
  BITBUCKET_USERNAME,
  BITBUCKET_PASSWORD,
  RENOVATE_BOT_USER,
};

const log = bunyan.createLogger({
  name: 'renovate-approve-bot',
  serializers: {
    res: bunyan.stdSerializers.res,
  },
});

function createAdapter() {
  if (!BITBUCKET_URL) {
    return new BitbucketCloudAdapter({ ...DEFAULT_ADAPTER_OPTIONS, log });
  }

  return new BitbucketDataCenterAdapter(log, {
    ...DEFAULT_ADAPTER_OPTIONS,
    BITBUCKET_URL,
    log,
  });
}

async function main() {
  if (!BITBUCKET_USERNAME || !BITBUCKET_PASSWORD || !RENOVATE_BOT_USER) {
    log.fatal(
      'At least one of BITBUCKET_USERNAME, BITBUCKET_PASSWORD, RENOVATE_BOT_USER environement variables is not set.'
    );
    process.exit(1);
  }

  const adapter = createAdapter();

  let prHrefs;
  try {
    prHrefs = await adapter.getPullRequests();
  } catch (error) {
    log.fatal(error);
    process.exit(1);
  }

  for await (const prHref of prHrefs) {
    log.info('Approving: %s', prHref);
    adapter
      .approvePullRequest(prHref)
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
