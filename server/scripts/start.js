const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

console.log('[Startup] Node Environment:', process.env.NODE_ENV || 'production');
console.log('[Startup] Target Database:', isPostgres ? 'PostgreSQL' : 'SQLite');

const serverDir = path.resolve(__dirname, '..');
const prismaDir = path.join(serverDir, 'prisma');
const schemaPath = isPostgres
  ? path.join(prismaDir, 'schema.postgresql.prisma')
  : path.join(prismaDir, 'schema.prisma');

try {
  if (isPostgres) {
    console.log('[Startup] Generating Prisma client for PostgreSQL...');
    execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit', cwd: serverDir });

    console.log('[Startup] Pushing schema to PostgreSQL database...');
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, { stdio: 'inherit', cwd: serverDir });

    console.log('[Startup] Verifying seed data in PostgreSQL...');
    try {
      execSync(`npx tsx prisma/seed.ts`, { stdio: 'inherit', cwd: serverDir });
    } catch (seedErr) {
      console.warn('[Startup] Seed message:', seedErr.message);
    }
  } else {
    console.log('[Startup] Ensuring Prisma client for SQLite...');
    execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit', cwd: serverDir });
  }
} catch (err) {
  console.error('[Startup] Warning during DB migration:', err.message);
}

console.log('[Startup] Starting Express Server...');
require('../dist/index.js');
