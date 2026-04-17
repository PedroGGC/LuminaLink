import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { linkRoutes } from './routes/links.js';
import { redirectRoutes } from './routes/redirect.js';
import { qrcodeRoutes } from './routes/qrcode.js';
import { previewRoutes } from './routes/preview.js';
import { utmRoutes } from './routes/utm.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3002');

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

async function start() {
  try {
    await app.register(cors);
    await app.register(helmet);
    await app.register(linkRoutes);
    await app.register(redirectRoutes);
    await app.register(qrcodeRoutes);
    await app.register(previewRoutes);
    await app.register(utmRoutes);

    app.get('/health', async () => ({ status: 'ok' }));

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app, prisma };