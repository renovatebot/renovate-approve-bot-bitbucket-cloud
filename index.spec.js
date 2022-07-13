const BITBUCKET_URL = 'http://bitbucket.example';
const BITBUCKET_USERNAME = 'renovate-approve-bot';
const BITBUCKET_PASSWORD = 'r3novate-@pprove-b0t';
const RENOVATE_BOT_USER = 'renovate-bot';

process.env = Object.assign(process.env, {
  BITBUCKET_USERNAME,
  BITBUCKET_PASSWORD,
  RENOVATE_BOT_USER,
});

const bot = require('./index');
const BitbucketCloudAdapter = require('./adapter/bitbucket-cloud');
const BitbucketDataCenterAdapter = require('./adapter/bitbucket-data-center');

describe('createAdapter', () => {
  it('creates a Bitbucket Cloud adapter by default', () => {
    const createAdapter = bot.__get__('createAdapter');

    expect(createAdapter()).toBeInstanceOf(BitbucketCloudAdapter);
  });

  it('is not automerging', () => {
    bot.__set__('BITBUCKET_URL', BITBUCKET_URL);
    const createAdapter = bot.__get__('createAdapter');

    expect(createAdapter()).toBeInstanceOf(BitbucketDataCenterAdapter);
  });
});
