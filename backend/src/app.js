import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import v1Routes from './routes/v1/index.js';
import prisma from './config/db.js';
import { redis } from './config/redis.js';

export const createApp = () => {
  const app = express();

  // ── Security ──────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );
  app.use(hpp());
  // xss-clean alternative (express 4 compat via manual sanitization is preferred in prod with zod)

  // ── Parsers ───────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── Observability ─────────────────────────────────────
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.id }),
      serializers: {
        req: (req) => ({ method: req.method, url: req.url, id: req.id }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    })
  );

  // ── Rate limit ────────────────────────────────────────
  app.use(globalLimiter);

  // ── Health checks (no auth) — Spec §62 ─────────────────
  app.get('/health', async (_req, res) => {
    const checks = { status: 'ok', timestamp: new Date().toISOString() };

    // DB check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
      checks.status = 'degraded';
    }

    // Redis check (non-blocking — degraded if missing)
    try {
      if (redis.status === 'ready') {
        await redis.ping();
        checks.redis = 'ok';
      } else {
        checks.redis = 'not_connected';
        checks.status = checks.status === 'ok' ? 'degraded' : checks.status;
      }
    } catch {
      checks.redis = 'error';
      checks.status = 'degraded';
    }

    const code = checks.status === 'ok' ? 200 : 503;
    return res.status(code).json(checks);
  });

  app.get('/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ status: 'ready' });
    } catch {
      return res.status(503).json({ status: 'not_ready', database: 'error' });
    }
  });

  // ── API ───────────────────────────────────────────────
  app.use('/api/v1', v1Routes);

  // ── 404 ───────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Centralized error handler (must be last) ──────────
  app.use(errorHandler);

  return app;
};
