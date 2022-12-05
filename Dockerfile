FROM node:18-alpine

COPY dist/index.js .

ENTRYPOINT ["node", "index.js"]