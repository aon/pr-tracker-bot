FROM node:16-alpine

RUN apk --no-cache add curl

WORKDIR /usr/src/app

COPY . .
RUN npm install

EXPOSE 8080

RUN npm run build
RUN npm prune --omit=dev
RUN rm -rf src

CMD [ "npm", "start" ]

HEALTHCHECK CMD curl -f http://localhost:8080/healthcheck || exit 1
