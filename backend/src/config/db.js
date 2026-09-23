import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');
    return prisma;
  } catch (err) {
    logger.error({ err }, '❌ Prisma connection failed');
    throw err;
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
};

export { prisma };
export default prisma;
