const got = require('got');

const MANUAL_MERGE_MESSAGE = 'merge this manually';

class BitbucketCloudAdapter {
  constructor(options) {
    this.options = options;
    this.log = options.log;
    this.defaultRequestOptions = {
      prefixUrl: 'https://api.bitbucket.org',
      // If we use username/password options, they will be URL encoded
      // https://github.com/sindresorhus/got/issues/1169
      // https://github.com/nodejs/node/issues/31439
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${options.BITBUCKET_USERNAME}:${options.BITBUCKET_PASSWORD}`
        ).toString('base64')}`,
      },
      responseType: 'json',
    };
  }

  isAutomerging(pr) {
    try {
      return !pr.description.includes(MANUAL_MERGE_MESSAGE);
    } catch (error) {
      this.log.error(error);
      return false;
    }
  }

  getPullRequests() {
    const prEndpoint = `/2.0/pullrequests/${this.options.RENOVATE_BOT_USER}`;
    this.log.info(
      'Requesting %s%s...',
      this.defaultRequestOptions.prefixUrl,
      prEndpoint
    );

    return got.paginate('', {
      ...this.defaultRequestOptions,
      pathname: prEndpoint,
      pagination: {
        transform: (response) =>
          response.body.values
            .filter((pr) => this.isAutomerging(pr))
            .map((pr) => pr.links.self.href),
        paginate: (response) => {
          if ('next' in response.body && response.body.next !== '') {
            this.options.log.info('Requesting %s...', response.body.next);
            return {
              url: new URL(response.body.next),
            };
          }
          this.options.log.info('All pull-requests gathered.');
          return false;
        },
      },
    });
  }

  approvePullRequest(prHref) {
    return got('', {
      ...this.defaultRequestOptions,
      prefixUrl: `${prHref}/approve`,
      method: 'POST',
      throwHttpErrors: false,
    });
  }
}

module.exports = BitbucketCloudAdapter;
