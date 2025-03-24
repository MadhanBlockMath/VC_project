FROM node:14-slim AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod 777 /usr/src/app/config.json
EXPOSE 80
CMD [ "node", "index.js" ]
