const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

const prismaDir = path.resolve(__dirname, '../prisma');
const schemaPath = isPostgres 
  ? path.join(prismaDir, 'schema.postgresql.prisma')
  : path.join(prismaDir, 'schema.prisma');

console.log(`[DB Setup] Using ${isPostgres ? 'PostgreSQL' : 'SQLite'} schema: ${schemaPath}`);

try {
  // Generate Prisma client for the active schema
  execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit' });
  
  // If Postgres, automatically push schema to remote database
  if (isPostgres) {
    console.log('[DB Setup] Pushing schema tables to PostgreSQL...');
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, { stdio: 'inherit' });
  }
} catch (err) {
  console.error('[DB Setup] Error during DB setup:', err.message);
  process.exit(1);
}
