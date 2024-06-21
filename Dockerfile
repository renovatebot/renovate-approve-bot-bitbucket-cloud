FROM docker.io/library/node:18.20.3-alpine@sha256:ce8c18ad1dc0f9b980698e6de7a31293a7c95b0e8b8b3560270c1aff6d3eeeb6

LABEL \
  org.opencontainers.image.source="https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud" \
  org.opencontainers.image.url="https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud" \
  org.opencontainers.image.licenses="ISC"

WORKDIR /opt/app

RUN corepack enable npm

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 1000:1000

CMD ["index.js"]
