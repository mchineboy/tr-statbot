FROM node:18-alpine

COPY ./dist/* .

# Avoid a situation where .env isn't needed (Tyler's k8s setup)
COPY ./.env* .

COPY package.json .
RUN pnpm install --production

ENTRYPOINT ["node", "index.js"]