FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
COPY /shared/package*.json ./shared/
COPY /notification/package*.json ./notification/

RUN npm ci --ignore-scripts

COPY /shared/ ./shared
COPY /notification/ ./notification/

RUN npm run build --workspace=@istream/shared
RUN npm run build --workspace=notification

FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY /shared/package*.json ./shared/
COPY /notification/package*.json ./notification/

RUN npm ci --omit=dev

COPY --from=build /usr/src/app/shared/dist ./shared/dist
COPY --from=build /usr/src/app/notification/dist ./notification/dist

CMD ["npm", "start", "--workspace=notification"]
