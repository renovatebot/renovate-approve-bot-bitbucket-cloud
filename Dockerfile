FROM docker.io/library/node:14.19.0-alpine@sha256:a7bbf324f0d8f4f78abf20a9fb2b08ff4b8b0a20e562a49baf5d649cfd3906d9

LABEL \
  org.opencontainers.image.source="https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud" \
  org.opencontainers.image.url="https://github.com/renovatebot/renovate-approve-bot-bitbucket-cloud" \
  org.opencontainers.image.licenses="ISC"

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 1000:1000

CMD ["index.js"]
