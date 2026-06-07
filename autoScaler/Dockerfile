FROM node:20-alpine

WORKDIR /app

COPY /shared ./shared
COPY package*.json ./
COPY /autoScaler/ ./autoScaler/

RUN npm ci

CMD ["node", "autoScaler/src/index.js" ]
