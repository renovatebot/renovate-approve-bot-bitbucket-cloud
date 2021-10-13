FROM docker.io/library/node:14.18.1-alpine@sha256:a251de4db0e0632446c0ba62adbe1e37ff148a53732e4574d2ed0f5462cc4407

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 65534:65534

CMD ["index.js"]
