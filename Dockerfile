FROM node:18-alpine

COPY ./dist/index.js .

# Avoid a situation where .env isn't needed (Tyler's k8s setup)
COPY ./.env* .

ENTRYPOINT ["node", "index.js"]