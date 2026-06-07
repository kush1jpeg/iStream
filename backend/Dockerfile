FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY /shared/ ./shared
COPY ./backend/ ./backend

RUN npm ci

RUN npm run build --workspace=backend

CMD ["npm", "start", "--workspace=backend"]
