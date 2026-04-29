FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Worker runs via ts-node in dev, but should be compiled for prod
# For now, we'll use ts-node for simplicity or add a build step
CMD ["npx", "ts-node", "src/index.ts"]
