FROM node:22-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
# Install dependencies
RUN pnpm i --frozen-lockfile

# Copy source code
COPY . .
EXPOSE 8080
# Build TypeScript
RUN pnpm run build

# Command to run the app
CMD ["node", "dist/index.js"]