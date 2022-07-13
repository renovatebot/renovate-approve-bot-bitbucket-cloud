const nock = require('nock');
const BitbucketCloudAdapter = require('./bitbucket-cloud');

const BITBUCKET_USERNAME = 'renovate-approve-bot';
const BITBUCKET_PASSWORD = 'r3novate-@pprove-b0t';
const RENOVATE_BOT_USER = 'renovate-bot';

const API_BASE_URL = 'https://api.bitbucket.org';
const BASIC_AUTH = { user: BITBUCKET_USERNAME, pass: BITBUCKET_PASSWORD };

const autoMergeDescription = '...\n\n🚦 **Automerge**: Enabled.\n\n...';
const manualMergeDescription =
  '...\n\n🚦 **Automerge**: Disabled by config. Please merge this manually once you are satisfied.\n\n...';

afterEach(() => {
  if (!nock.isDone()) {
    throw new Error(
      `Not all nock interceptors were used: ${JSON.stringify(
        nock.pendingMocks()
      )}`
    );
  }
  nock.cleanAll();
});

describe('isAutomerging', () => {
  const adapter = new BitbucketCloudAdapter({});

  it('is automerging', () => {
    const pr = {
      description: autoMergeDescription,
      // omitted attributes...
    };

    expect(adapter.isAutomerging(pr)).toBe(true);
  });

  it('is not automerging', () => {
    const pr = {
      description: manualMergeDescription,
      // omitted attributes...
    };

    expect(adapter.isAutomerging(pr)).toBe(false);
  });
});

describe('getPullRequests', () => {
  const adapter = new BitbucketCloudAdapter({
    BITBUCKET_USERNAME,
    BITBUCKET_PASSWORD,
    RENOVATE_BOT_USER,
    log: { info: jest.fn() },
  });
  const pullRequestsEndpoint = `/2.0/pullrequests/${RENOVATE_BOT_USER}`;

  it('gets pull-requests in a single page', async () => {
    nock(API_BASE_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .reply(200, {
        values: [
          {
            description: autoMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/1',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: manualMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/2',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/3',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
        ],
        // omitted attributes...
      });

    const pullRequests = [];
    const prGenerator = await adapter.getPullRequests();
    for await (const prHref of prGenerator) {
      pullRequests.push(prHref);
    }

    expect(pullRequests).toStrictEqual([
      'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/1',
      'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/3',
    ]);
  });

  it('gets pull-requests in multiple pages', async () => {
    nock(API_BASE_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .reply(200, {
        values: [
          {
            description: autoMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/1',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: manualMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/2',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/3',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
        ],
        next: `${API_BASE_URL}${pullRequestsEndpoint}?page=2`,
        // omitted attributes...
      });

    nock(API_BASE_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .query({ page: 2 })
      .reply(200, {
        values: [
          {
            description: manualMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/5',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            links: {
              self: {
                href: 'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/6',
              },
              // omitted attributes...
            },
            // omitted attributes...
          },
        ],
        // omitted attributes...
      });

    const prHrefs = [];
    const prGenerator = await adapter.getPullRequests();
    for await (const prHref of prGenerator) {
      prHrefs.push(prHref);
    }

    expect(prHrefs).toStrictEqual([
      'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/1',
      'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/3',
      'https://api.bitbucket.org/2.0/repositories/myworkspace/myrepo/pullrequests/6',
    ]);
  });

  it('gets no pull-requests', async () => {
    nock(API_BASE_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .reply(200, {
        values: [],
        // omitted attributes...
      });

    const prHrefs = [];
    const prGenerator = await adapter.getPullRequests();
    for await (const prHref of prGenerator) {
      prHrefs.push(prHref);
    }

    expect(prHrefs).toStrictEqual([]);
  });
});

describe('approvePullRequest', () => {
  const adapter = new BitbucketCloudAdapter({
    BITBUCKET_USERNAME,
    BITBUCKET_PASSWORD,
    RENOVATE_BOT_USER,
    log: { info: jest.fn() },
  });

  it('approves', async () => {
    const prHref = '/2.0/repositories/myworkspace/myrepo/pullrequests/1';
    nock(API_BASE_URL)
      .post(`${prHref}/approve/`)
      .basicAuth(BASIC_AUTH)
      .reply(200, {
        // omitted attributes...
      });

    const response = await adapter.approvePullRequest(API_BASE_URL + prHref);

    expect(response.statusCode).toBe(200);
  });

  it('is already approved', async () => {
    const prHref = '/2.0/repositories/myworkspace/myrepo/pullrequests/2';
    nock(API_BASE_URL)
      .post(`${prHref}/approve/`)
      .basicAuth(BASIC_AUTH)
      .reply(409, {
        type: 'error',
        error: {
          message: 'You already approved this pull request.',
        },
      });

    const response = await adapter.approvePullRequest(API_BASE_URL + prHref);

    expect(response.statusCode).toBe(409);
  });
});
