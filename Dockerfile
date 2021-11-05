FROM docker.io/library/node:14.18.1-alpine@sha256:c346198378f78f8611254dce222e7e6635804e41e5203d1825321edd6c59dca1

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
