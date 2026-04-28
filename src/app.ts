import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import dotenv from 'dotenv';
import { linkRoutes } from './routes/links.js';
import { redirectRoutes } from './routes/redirect.js';
import { qrcodeRoutes } from './routes/qrcode.js';
import { previewRoutes } from './routes/preview.js';
import { utmRoutes } from './routes/utm.js';
import { unlockRoutes } from './routes/unlock.js';
import { statsRoutes } from './routes/stats.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { authRoutes } from './routes/auth.js';
import fastifyStatic from '@fastify/static';
import { resolve } from 'path';
import { getRedis } from './db/redis.js';
import { startClickWorker } from './services/click-worker.js';
import { cleanupExpiredLinks } from './services/link.service.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3002');
const PUBLIC_ROOT = resolve('./src/public');

const app = Fastify({ logger: true });

async function start() {
  try {
    // Initialize Redis connection
    const redis = getRedis();
    if (redis) {
      console.log('[Redis] Client initialized');
    } else {
      console.warn('[Redis] Not available, using DB fallback');
    }

    // Start click worker
    startClickWorker();

    // Cleanup expired links every hour
    cleanupExpiredLinks();
    setInterval(cleanupExpiredLinks, 3600000);

    await app.register(cors);
    await app.register(helmet, {
      contentSecurityPolicy: false,
    });
    await app.register(cookie);
    await app.register(fastifyStatic, {
      root: PUBLIC_ROOT,
      wildcard: false,
    });
    
    await app.register(redirectRoutes);
    await app.register(linkRoutes);
    await app.register(qrcodeRoutes);
    await app.register(previewRoutes);
    await app.register(utmRoutes);
    await app.register(unlockRoutes);
    await app.register(statsRoutes);
    await app.register(dashboardRoutes);
    await app.register(authRoutes);

    app.get('/health', async () => ({ status: 'ok' }));

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app };