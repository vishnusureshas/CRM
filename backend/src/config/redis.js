import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

// Upstash and other managed Redis use `rediss://` (TLS). ioredis auto-enables TLS
// for `rediss://`, but explicit `tls: {}` guarantees TLS on all Node/OpenSSL combos
// and avoids "self-signed certificate" / ECONNREFUSED on Render.
const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new IORedis(env.REDIS_URL, {
  // BullMQ requires maxRetriesPerRequest = null
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
  // Production hardening — timeouts & keep-alive to avoid hanging on Render cold-start
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,
  enableAutoPipelining: false,
  // TLS for Upstash (rediss://)
  ...(isTls ? { tls: {}, enableTLSForSentinelMode: false } : {}),
  // Exponential backoff; cap at 5s. Return null would stop retrying, so we always retry
  retryStrategy(times) {
    if (times > 20) {
      logger.error('Redis retry exhausted after 20 attempts');
      return null; // stop retrying — app stays degraded (health will show not_connected)
    }
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  reconnectOnError(err) {
    // Reconnect on READONLY errors (failover). Keep false for other errors to surface via 'error' event
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) return true;
    return false;
  },
});

redis.on('connect', () => logger.info('Redis connecting...'));
redis.on('ready', () => logger.info('✅ Redis ready'));
redis.on('error', (err) => logger.error({ err: err.message ?? err }, 'Redis error'));
redis.on('close', () => logger.warn('Redis connection closed'));
redis.on('reconnecting', (delay) => logger.info({ delay }, 'Redis reconnecting...'));

export const connectRedis = async () => {
  if (redis.status === 'ready') return redis;
  // wait status can mean a prior connect() is in-flight — let it settle
  if (redis.status === 'connecting' || redis.status === 'connect') {
    try {
      // give current attempt up to 5s to become ready before reporting degraded
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Redis connect timeout')), 5000);
        redis.once('ready', () => { clearTimeout(t); resolve(); });
        redis.once('error', (e) => { clearTimeout(t); reject(e); });
      });
      if (redis.status === 'ready') return redis;
    } catch {}
    return null;
  }
  try {
    await redis.connect();
    return redis;
  } catch (err) {
    logger.warn({ err: err.message ?? err }, '⚠️ Redis not available — caching/queues will be degraded (check REDIS_URL, use rediss:// for Upstash)');
    return null;
  }
};

export const disconnectRedis = async () => {
  try {
    if (redis.status === 'ready' || redis.status === 'connecting') await redis.quit();
    else redis.disconnect();
  } catch {
    // ignore
  }
};
