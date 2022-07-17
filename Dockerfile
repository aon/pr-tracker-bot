FROM node:16-alpine

WORKDIR /usr/src/app

COPY . .
RUN npm install

EXPOSE 8080

RUN npm run build
RUN npm prune --omit=dev
RUN rm -rf src

CMD [ "npm", "start" ]
