FROM node:16.10.0-alpine as kuchapa_api_container

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 4000

CMD ["node", "server.js"]