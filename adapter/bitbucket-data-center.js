const got = require('got');

const MANUAL_MERGE_MESSAGE = 'merge this manually';

class BitbucketDataCenterAdapter {
  constructor(options) {
    this.options = options;
    this.log = options.log;
    this.defaultRequestOptions = {
      prefixUrl: options.BITBUCKET_URL,
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

  isCreatedByRenovateBot(pr) {
    try {
      return pr.author.user.slug === this.options.RENOVATE_BOT_USER;
    } catch (error) {
      this.log.error(error);
      return false;
    }
  }

  isAutomerging(pr) {
    try {
      return !pr.description.includes(MANUAL_MERGE_MESSAGE);
    } catch (error) {
      this.log.error(error);
      return false;
    }
  }

  extractApiUrl(pr) {
    for (const link of pr.links.self) {
      const match = link.href.match(
        /\/((?:projects|users)\/\S+\/repos\/\S+\/pull-requests\/\d+)/
      );

      if (match) {
        return [`${this.options.BITBUCKET_URL}/rest/api/1.0/${match[1]}`];
      }
    }

    this.log.error('Could not extract API URL for %s', pr.links.self[0].href);
    return [];
  }

  getPullRequests() {
    const prEndpoint = 'rest/api/1.0/dashboard/pull-requests';
    this.log.info(
      'Requesting %s/%s...',
      this.defaultRequestOptions.prefixUrl,
      prEndpoint
    );

    return got.paginate(prEndpoint, {
      ...this.defaultRequestOptions,
      searchParams: {
        role: 'REVIEWER',
        state: 'OPEN',
      },
      pagination: {
        transform: (response) =>
          response.body.values
            .filter((pr) => this.isCreatedByRenovateBot(pr))
            .filter((pr) => this.isAutomerging(pr))
            .flatMap((pr) => this.extractApiUrl(pr)),
        paginate: (response) => {
          if ('isLastPage' in response.body && !response.body.isLastPage) {
            return {
              searchParams: {
                start: response.body.nextPageStart,
              },
            };
          }

          this.log.info('All pull-requests gathered.');
          return false;
        },
      },
    });
  }

  approvePullRequest(prHref) {
    return got(`participants/${this.options.BITBUCKET_USERNAME}`, {
      ...this.defaultRequestOptions,
      prefixUrl: prHref,
      method: 'PUT',
      throwHttpErrors: false,
      json: {
        status: 'APPROVED',
      },
    });
  }
}

module.exports = BitbucketDataCenterAdapter;
