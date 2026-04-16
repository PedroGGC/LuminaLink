import { FastifyInstance } from 'fastify';
import { getLinkBySlug } from '../services/link.service.js';
import { buildUTMUrl, UTMParams } from '../utils/utm.js';

export async function utmRoutes(fastify: FastifyInstance) {
  fastify.get('/api/links/:shortCode/utm', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };
    const query = request.query as UTMParams;

    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const utmUrl = buildUTMUrl(link.originalUrl, query);
    return { originalUrl: utmUrl, hasUTM: true };
  });
}