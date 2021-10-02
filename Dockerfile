FROM node:14.18.0-alpine@sha256:fe676cd79c27a562f8be7b0c57255b0457ac66d5c32d9ab88a9e836d92a6f6ea

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 65534:65534

CMD ["index.js"]
