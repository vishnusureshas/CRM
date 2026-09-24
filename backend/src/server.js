import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

const app = createApp();
let server;

const start = async () => {
  try {
    // Connect to DB (fail fast in production; degraded warning in dev if DB missing)
    try {
      await connectDB();
    } catch (err) {
      if (env.NODE_ENV === 'production') throw err;
      logger.warn('⚠️ DB not reachable — server starting in degraded mode (health will show error)');
    }

    // Connect Redis (optional — degraded if missing)
    await connectRedis().catch(() => logger.warn('Redis not available — continuing without cache'));

    // Auto-seed for free Render plans (no Shell) — idempotent, runs only if permissions empty
    try {
      const { prisma } = await import('./config/db.js');
      const permCount = await prisma.permission.count().catch(() => 0);
      if (permCount === 0) {
        logger.info('🌱 No permissions found — auto-seeding roles/permissions...');
        const seedMod = await import('../prisma/seed.js');
        const seedFn = seedMod.default || seedMod.main;
        if (typeof seedFn === 'function') {
          await seedFn();
          await prisma.$disconnect().catch(() => {});
          // re-connect after seed's disconnect
          await prisma.$connect().catch(() => {});
        }
        logger.info('✅ Auto-seed complete');
      } else {
        // ensure admin has perms (fixes 403 for workspaces created before seed fix)
        const adminRole = await prisma.role.findFirst({ where: { slug: 'admin' } }).catch(() => null);
        const adminPerms = adminRole ? await prisma.rolePermission.count({ where: { roleId: adminRole.id } }).catch(() => 0) : 0;
        if (adminRole && adminPerms === 0) {
          logger.info('🌱 Admin role has no perms — patching...');
          const seedMod = await import('../prisma/seed.js');
          const seedFn = seedMod.default || seedMod.main;
          if (typeof seedFn === 'function') await seedFn();
          await prisma.$disconnect().catch(() => {});
          await prisma.$connect().catch(() => {});
          logger.info('✅ Admin perms patched');
        }
      }
    } catch (e) {
      logger.warn({ err: e?.message ?? e }, 'Auto-seed skipped/failed — run node prisma/seed.js manually if 403 persists');
    }

    server = app.listen(env.PORT, () => {
      logger.info(`🚀 CRM Backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`   Health → http://localhost:${env.PORT}/health`);
      logger.info(`   API v1 → http://localhost:${env.PORT}/api/v1`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`Received ${signal} — shutting down gracefully...`);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
    await disconnectRedis();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  shutdown('uncaughtException');
});

start();

export { app, server };
