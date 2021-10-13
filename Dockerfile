FROM node:14.18.1-alpine@sha256:a8409dff6597f2ef5f7ecd3c672671bb2af9a390073efd74f95c54aa41cba22a

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 65534:65534

CMD ["index.js"]
