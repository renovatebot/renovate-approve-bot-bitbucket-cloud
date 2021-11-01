FROM docker.io/library/node:14.18.1-alpine@sha256:dc92f36e7cd917816fa2df041d4e9081453366381a00f40398d99e9392e78664

LABEL \
  org.opencontainers.image.source="https://github.com/maxbrunet/renovate-approve-bot" \
  org.opencontainers.image.url="https://github.com/maxbrunet/renovate-approve-bot" \
  org.opencontainers.image.licenses="ISC"

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 65534:65534

CMD ["index.js"]
