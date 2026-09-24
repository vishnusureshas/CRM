import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  // Prisma pools via DATABASE_URL query params:
  // e.g. postgresql://.../db?connection_limit=10&pool_timeout=20&connect_timeout=10
  // For Render/Neon free tier keep connection_limit 5-10 (each instance holds a pool).
  // No explicit datasourceUrl override here — uses env DATABASE_URL.
});

export const connectDB = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('✅ PostgreSQL connected via Prisma');
      return prisma;
    } catch (err) {
      const isLast = attempt === retries;
      logger.error({ err: err.message ?? err, attempt }, `❌ Prisma connection failed (attempt ${attempt}/${retries})`);
      if (isLast) throw err;
      // transient cold-start / DNS on Render — backoff 1s * attempt
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
};

export { prisma };
export default prisma;
