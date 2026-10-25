import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// If database file doesn't exist yet, seed it from initial_data.db
const dbPaths = [
  path.resolve(__dirname, '../prisma/dev.db'),
  path.resolve(__dirname, '../../prisma/dev.db'),
  path.resolve(process.cwd(), 'server/prisma/dev.db'),
  path.resolve(process.cwd(), 'prisma/dev.db'),
];
const templatePaths = [
  path.resolve(__dirname, '../prisma/initial_data.db'),
  path.resolve(__dirname, '../../prisma/initial_data.db'),
  path.resolve(process.cwd(), 'server/prisma/initial_data.db'),
  path.resolve(process.cwd(), 'prisma/initial_data.db'),
];

const templateFile = templatePaths.find((p) => fs.existsSync(p));
const targetFile = dbPaths.find((p) => fs.existsSync(path.dirname(p)));

if (templateFile && targetFile && !fs.existsSync(targetFile)) {
  try {
    fs.copyFileSync(templateFile, targetFile);
    console.log('✅ Initialized database from initial_data.db template');
  } catch (err) {
    console.error('Warning: could not copy initial database:', err);
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
