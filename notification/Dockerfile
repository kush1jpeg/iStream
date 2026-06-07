FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY /shared/ ./shared
COPY /notification  ./notification

RUN npm ci

RUN npm run build --workspace=notification

CMD ["npm", "start", "--workspace=notification"]

