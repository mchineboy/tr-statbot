FROM node:18-alpine

COPY ./dist/index.js .
COPY ./.env .

ENTRYPOINT ["node", "index.js"]