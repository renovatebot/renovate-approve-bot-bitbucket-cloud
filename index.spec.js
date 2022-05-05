const nock = require('nock');

const BITBUCKET_URL = 'http://bitbucket.example';
const BITBUCKET_USERNAME = 'renovate-approve-bot';
const BITBUCKET_PASSWORD = 'r3novate-@pprove-b0t';
const RENOVATE_BOT_USER = 'renovate-bot';

process.env = Object.assign(process.env, {
  BITBUCKET_URL,
  BITBUCKET_USERNAME,
  BITBUCKET_PASSWORD,
  RENOVATE_BOT_USER,
});

const bot = require('./index');

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
  it('is automerging', () => {
    const pr = {
      description: autoMergeDescription,
      // omitted attributes...
    };

    const isAutomerging = bot.__get__('isAutomerging');

    expect(isAutomerging(pr)).toBe(true);
  });

  it('is not automerging', () => {
    const pr = {
      description: manualMergeDescription,
      // omitted attributes...
    };

    const isAutomerging = bot.__get__('isAutomerging');

    expect(isAutomerging(pr)).toBe(false);
  });
});

describe('getPullRequests', () => {
  const pullRequestsEndpoint = '/rest/api/1.0/dashboard/pull-requests';

  it('gets pull-requests in a single page', async () => {
    nock(BITBUCKET_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .query({
        role: 'REVIEWER',
        state: 'OPEN',
      })
      .reply(200, {
        values: [
          {
            description: autoMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/users/myuser/repos/myrepo/pull-requests/1',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: manualMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/2',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/3',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            author: {
              user: {
                slug: `not-${RENOVATE_BOT_USER}`,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/3',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
        ],
        // omitted attributes...
      });

    const getPullRequests = bot.__get__('getPullRequests');

    const pullRequests = [];
    const prGenerator = await getPullRequests();
    for await (const prHref of prGenerator) {
      pullRequests.push(prHref);
    }

    expect(pullRequests).toStrictEqual([
      'http://bitbucket.example/rest/api/1.0/users/myuser/repos/myrepo/pull-requests/1',
      'http://bitbucket.example/rest/api/1.0/projects/myproject/repos/myrepo/pull-requests/3',
    ]);
  });

  it('gets pull-requests in multiple pages', async () => {
    nock(BITBUCKET_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .query({
        role: 'REVIEWER',
        state: 'OPEN',
      })
      .reply(200, {
        values: [
          {
            description: autoMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/1',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: manualMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/2',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/3',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
        ],
        isLastPage: false,
        nextPageStart: 3,
        // omitted attributes...
      });

    nock(BITBUCKET_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .query({
        role: 'REVIEWER',
        state: 'OPEN',
        start: 3,
      })
      .reply(200, {
        values: [
          {
            description: manualMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/5',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
          {
            description: autoMergeDescription,
            author: {
              user: {
                slug: RENOVATE_BOT_USER,
                // omitted attributes...
              },
              // omitted attributes...
            },
            links: {
              self: [
                {
                  href: 'https://bitbucket.example/projects/myproject/repos/myrepo/pull-requests/6',
                },
              ],
              // omitted attributes...
            },
            // omitted attributes...
          },
        ],
        isLastPage: true,
        // omitted attributes...
      });

    const getPullRequests = bot.__get__('getPullRequests');

    const prHrefs = [];
    const prGenerator = await getPullRequests();
    for await (const prHref of prGenerator) {
      prHrefs.push(prHref);
    }

    expect(prHrefs).toStrictEqual([
      'http://bitbucket.example/rest/api/1.0/projects/myproject/repos/myrepo/pull-requests/1',
      'http://bitbucket.example/rest/api/1.0/projects/myproject/repos/myrepo/pull-requests/3',
      'http://bitbucket.example/rest/api/1.0/projects/myproject/repos/myrepo/pull-requests/6',
    ]);
  });

  it('gets no pull-requests', async () => {
    nock(BITBUCKET_URL)
      .get(pullRequestsEndpoint)
      .basicAuth(BASIC_AUTH)
      .query({
        role: 'REVIEWER',
        state: 'OPEN',
      })
      .reply(200, {
        values: [],
        isLastPage: true,
        // omitted attributes...
      });

    const getPullRequests = bot.__get__('getPullRequests');

    const prHrefs = [];
    const prGenerator = await getPullRequests();
    for await (const prHref of prGenerator) {
      prHrefs.push(prHref);
    }

    expect(prHrefs).toStrictEqual([]);
  });
});

describe('approvePullRequest', () => {
  it('approves', async () => {
    const prHref =
      '/rest/api/1.0/projects/myproject/repos/myrepo/pull-requests/1';
    nock(BITBUCKET_URL)
      .put(`${prHref}/participants/${BITBUCKET_USERNAME}`)
      .basicAuth(BASIC_AUTH)
      .reply(200, {
        // omitted attributes...
      });

    const approvePullRequest = bot.__get__('approvePullRequest');

    const response = await approvePullRequest(BITBUCKET_URL + prHref);

    expect(response.statusCode).toBe(200);
  });

  it('is already approved', async () => {
    const prHref =
      '/rest/api/1.0/projects/myproject/repos/myrepo/pull-requests/2';
    nock(BITBUCKET_URL)
      .put(`${prHref}/participants/${BITBUCKET_USERNAME}`, {
        status: 'APPROVED',
      })
      .basicAuth(BASIC_AUTH)
      .reply(409, {
        type: 'error',
        error: {
          message: 'You already approved this pull request.',
        },
      });

    const approvePullRequest = bot.__get__('approvePullRequest');

    const response = await approvePullRequest(BITBUCKET_URL + prHref);

    expect(response.statusCode).toBe(409);
  });
});
