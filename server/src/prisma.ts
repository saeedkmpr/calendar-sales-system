import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Calculate exact absolute paths for SQLite database
const prismaDir = path.resolve(__dirname, '../prisma');
const devDbPath = path.join(prismaDir, 'dev.db');
const initialDbPath = path.join(prismaDir, 'initial_data.db');

// Ensure directory exists
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// If dev.db doesn't exist, restore from initial_data.db template
if (!fs.existsSync(devDbPath) && fs.existsSync(initialDbPath)) {
  try {
    fs.copyFileSync(initialDbPath, devDbPath);
    console.log('✅ Initialized SQLite database from authentic initial_data.db template');
  } catch (err) {
    console.error('Warning: could not copy initial database:', err);
  }
}

// Always use local SQLite for instant response without network delays
const dbUrl = `file:${devDbPath}`;
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
