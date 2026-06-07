FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY /shared/ ./shared
COPY /jobServer/ ./jobServer

RUN npm ci

CMD ["node", "jobServer/src/index.js"]
