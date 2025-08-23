FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production \
    MCP_RANCHER_STORE=/data/servers.json
COPY --from=build /app/dist ./dist
RUN addgroup -S mcp && adduser -S mcp -G mcp
USER mcp
ENTRYPOINT ["node", "dist/index.js"]
