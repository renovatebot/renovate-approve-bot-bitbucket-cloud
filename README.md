# renovate-approve-bot - Bitbucket Server Edition

A job to approve Pull Requests from [Renovate Bot](https://github.com/renovatebot/renovate) on Bitbucket Server. This enables you to require Pull Request approvals on your repository while also utilising Renovate's "automerge" feature.

For Github, see [renovatebot/renovate-approve-bot](https://github.com/renovatebot/renovate-approve-bot).
For Bitbucket Cloud, see [renovatebot/renovate-approve-bot-bitbucket-cloud](https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud).

[![build](https://github.com/yieldlab/renovate-approve-bot-bitbucket-server/actions/workflows/build.yml/badge.svg)](https://github.com/yieldlab/renovate-approve-bot-bitbucket-server/actions/workflows/build.yml)

## How it works

On each run, the bot will:

1. Get all the open PRs assigned to the Renovate Approve Bot user
2. Filter out PRs not created by the Renovate Bot user
3. Filter out PRs where "automerge" is disabled
4. Approve the "automerge" PRs

## Usage

1. Create an account for the renovate-approve-bot in your Bitbucket Server instance
2. Grant read access on your repositories to the renovate-approve-bot account
3. Optionally, add the renovate-approve-bot account to the default reviewers if you require approval from default reviewers
4. Set the environment variables:
   - `BITBUCKET_URL`: URL of your Bitbucket Server instance
   - `BITBUCKET_USERNAME`: Bitbucket username associated with the account used for renovate-approve-bot
   - `BITBUCKET_PASSWORD`: Password of the Bitbucket account used for renovate-approve-bot
   - `RENOVATE_BOT_USER`: Bitbucket username of your Renovate Bot
5. Run the bot (on a schedule similarly to Renovate Bot, e.g. as a [Cron](https://en.wikipedia.org/wiki/Cron) job):

   - With Docker:

     ```shell
     docker run --rm \
       --env BITBUCKET_USERNAME \
       --env BITBUCKET_PASSWORD \
       --env RENOVATE_BOT_USER \
       ghcr.io/yieldlab/renovate-approve-bot-bitbucket-server:latest
     ```

   - From source:

     ```shell
     npm install --production
     node ./index.js
     ```

## Security / Disclosure

If you discover any important bug with `renovate-approve-bot-bitbucket-server` that may pose a security problem, please disclose it confidentially to renovate-disclosure@whitesourcesoftware.com first, so that it can be assessed and hopefully fixed prior to being exploited.
Please do not raise GitHub issues for security-related doubts or problems.
