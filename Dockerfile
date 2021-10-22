FROM docker.io/library/node:14.18.1-alpine@sha256:9079c86b161bbfc3d636a5a4bb1e2ff27e88d54db35801a94d4db06bcb43ce42

WORKDIR /opt/app

COPY package.json package-lock.json ./

RUN npm install --production

COPY index.js .

USER 65534:65534

CMD ["index.js"]
