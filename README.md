# renovate-approve-bot - Bitbucket Cloud Edition

A job to approve Pull Requests from [Renovate Bot](https://github.com/renovatebot/renovate) on Bitbucket Cloud. This enables you to require Pull Request approvals on your repository while also utilising Renovate's "automerge" feature.

For Github, see [renovatebot/renovate-approve-bot](https://github.com/renovatebot/renovate-approve-bot).

[![build](https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud/actions/workflows/build.yml/badge.svg)](https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud/actions/workflows/build.yml)

## How it works

On each run, the bot will:

1. Get all the open PRs from the Renovate Bot user
2. Filter out PRs where "automerge" is disabled
3. Approve the "automerge" PRs

## Usage

1. Create a Bitbucket Cloud account for the renovate-approve-bot and add it to your team (Recommended)
2. [Create an App password](https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/) with `pullrequest:write` scope
3. [Grant read access on your repositories](https://support.atlassian.com/bitbucket-cloud/docs/grant-repository-access-to-users-and-groups/) to the renovate-approve-bot account
4. Optionally, add the renovate-approve-bot account to the default reviewers if you require approval from default reviewers
5. Set the environment variables:
   - `BITBUCKET_USERNAME`: Bitbucket username associated with the account used for renovate-approve-bot
   - `BITBUCKET_PASSWORD`: Bitbucket App password created in step 2
   - `BITBUCKET_WORKSPACE`: Bitbucket workspace in which PR's will be searched for and approved
   - `RENOVATE_BOT_USER`: Bitbucket username of your Renovate Bot
6. Run the bot (on a schedule similarly to Renovate Bot, e.g. as a [Cron](https://en.wikipedia.org/wiki/Cron) job):

   - With Docker:

     ```shell
     docker run --rm \
       --env BITBUCKET_USERNAME \
       --env BITBUCKET_PASSWORD \
       --env BITBUCKET_WORKSPACE \
       --env RENOVATE_BOT_USER \
       ghcr.io/renovatebot/renovate-approve-bot-bitbucket-cloud:latest
     ```

   - From source:

     ```shell
     npm install --production
     node ./index.js
     ```

## Bitbucket Pipelines example

Example to run renovate-approve-bot in a custom Bitbucket Pipeline on a schedule:

1. Add `BITBUCKET_USERNAME` and `BITBUCKET_PASSWORD` and `BITBUCKET_WORKSPACE` to your [repository variables](https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/#Repository-variables)
2. Create a custom pipeline in your `bitbucket-pipelines.yml` file

   ```yaml
   pipelines:
     custom:
       renovate-approve-bot:
         - step:
             name: Renovate Approve Bot
             image: ghcr.io/renovatebot/renovate-approve-bot-bitbucket-cloud:latest
             script:
               - export RENOVATE_BOT_USER=your-renovate-bot-user
               - node /opt/app/index.js
   ```

3. Create a [schedule](https://support.atlassian.com/bitbucket-cloud/docs/pipeline-triggers/#On-schedule) for the custom pipeline (e.g. Hourly)

## Security / Disclosure

If you discover any important bug with `renovate-approve-bot-bitbucket-cloud` that may pose a security problem, please disclose it confidentially to renovate-disclosure@whitesourcesoftware.com first, so that it can be assessed and hopefully fixed prior to being exploited.
Please do not raise GitHub issues for security-related doubts or problems.
