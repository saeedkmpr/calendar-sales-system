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

# Generate Prisma Client & Build both client and server
RUN cd server && npx prisma generate
RUN npm run build:client
RUN npm run build:server

# Production runner image
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:./prisma/dev.db"
ENV JWT_SECRET="super-secure-secret-key-calendar-sales-2026"

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install --omit=dev

# Copy built frontend, compiled server, and prisma database
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
