import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connecting...'));
redis.on('ready', () => logger.info('✅ Redis ready'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));

export const connectRedis = async () => {
  if (redis.status === 'ready') return redis;
  try {
    await redis.connect();
    return redis;
  } catch (err) {
    logger.warn({ err }, '⚠️ Redis not available — caching/queues will be degraded');
    return null;
  }
};

export const disconnectRedis = async () => {
  try {
    await redis.quit();
  } catch {
    // ignore
  }
};
