const path = require('path');
const { execSync } = require('child_process');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

console.log('[Startup] Environment:', process.env.NODE_ENV || 'production');
console.log('[Startup] Database mode:', isPostgres ? 'PostgreSQL' : 'SQLite');

const serverDir = path.resolve(__dirname, '..');
const prismaDir = path.join(serverDir, 'prisma');
const schemaPath = isPostgres
  ? path.join(prismaDir, 'schema.postgresql.prisma')
  : path.join(prismaDir, 'schema.prisma');

// 1. Start Express immediately so port binds in < 0.2s and Render responds instantly
console.log('[Startup] Launching Express server immediately...');
require('../dist/index.js');

// 2. Run DB push & authentic data restore in background
if (isPostgres) {
  setTimeout(() => {
    try {
      console.log('[Startup] Syncing PostgreSQL schema tables in background...');
      execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
        stdio: 'inherit',
        cwd: serverDir,
      });

      console.log('[Startup] Checking authentic user data in PostgreSQL...');
      execSync(`node "${path.join(prismaDir, 'restore-real.js')}"`, {
        stdio: 'inherit',
        cwd: serverDir,
      });
      console.log('[Startup] ✅ Database initialization verified.');
    } catch (err) {
      console.warn('[Startup] Database background sync note:', err.message);
    }
  }, 100);
}
