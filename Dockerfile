FROM docker.io/library/node:14.19.1-alpine@sha256:8845b4f88f64f8c56a39236648ba22946e806a6153c10911f77b70e5a2edb4ca

LABEL \
  org.opencontainers.image.source="https://github.com/yieldlab/renovate-approve-bot-bitbucket-server" \
  org.opencontainers.image.url="https://github.com/yieldlab/renovate-approve-bot-bitbucket-server" \
  org.opencontainers.image.licenses="ISC"

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 1000:1000

CMD ["index.js"]
