FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install
RUN apk add --no-cache ffmpeg

COPY ./src/index.js .

CMD ["node", "index.js"]
