FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install
RUN apk add --no-cache ffmpeg

COPY ./src/ .

CMD ["node", "index.js"]
