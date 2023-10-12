FROM docker.io/library/node:18.18.1-alpine@sha256:f0d7c41a0614bbf3f7aa9960d9e1a43fc24373268de4c21cc8a346ec0165f993

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
