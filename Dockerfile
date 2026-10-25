# Multi-stage Dockerfile for Calendar Sales Management System
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install

# Copy source files
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma Client & Build
RUN cd server && npx prisma generate
RUN npm run build:client
RUN npm run build:server

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:./prisma/dev.db"
ENV JWT_SECRET="super-secure-secret-key-calendar-sales-2026"

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install --omit=dev

# Copy built artifacts and database files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
