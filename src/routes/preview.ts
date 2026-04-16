import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getLinkBySlug } from '../services/link.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function previewRoutes(fastify: FastifyInstance) {
  fastify.get('/:shortCode/preview', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };

    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const templatePath = path.join(__dirname, '../public/preview.html');
    let html = fs.readFileSync(templatePath, 'utf-8');
    html = html.replace(/{{ORIGINAL_URL}}/g, link.originalUrl);

    reply.header('Content-Type', 'text/html');
    return reply.send(html);
  });
}