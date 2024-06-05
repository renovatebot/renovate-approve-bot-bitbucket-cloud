FROM docker.io/library/node:18.20.3-alpine@sha256:5673c56eb275230628a5f2915b6eac6631c59f2a0754aa5e5dc5e74f996556b0

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
