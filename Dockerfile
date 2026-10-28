# Multi-stage Dockerfile for Calendar Sales Management System
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install openssl and tools required for Prisma on Linux
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies and linux rollup binary
RUN npm install
RUN cd client && npm install --no-save @rollup/rollup-linux-x64-gnu

# Copy source files
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma Client for PostgreSQL & Build both client and server
RUN cd server && npx prisma generate --schema=prisma/schema.postgresql.prisma
RUN npm run build:client
RUN npm run build:server

# Production runner image
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install production dependencies (including prisma and tsx in server/dependencies)
RUN npm install --omit=dev

# Copy built frontend, compiled server, scripts, and prisma database
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/scripts ./server/scripts
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma

# Provide database files at both /app/server/prisma and /app/prisma, and set full write permissions
RUN mkdir -p /app/prisma && cp -r /app/server/prisma/* /app/prisma/ 2>/dev/null || true
RUN chmod -R 777 /app/server/prisma /app/prisma 2>/dev/null || true

EXPOSE 5000

CMD ["node", "server/scripts/start.js"]
