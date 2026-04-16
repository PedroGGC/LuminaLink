import { FastifyInstance } from 'fastify';
import { createLink, getLinkBySlug } from '../services/link.service.js';

export async function linkRoutes(fastify: FastifyInstance) {
  fastify.post('/api/links', async (request, reply) => {
    const { originalUrl, customSlug } = request.body as { originalUrl: string; customSlug?: string };

    if (!originalUrl) {
      return reply.status(400).send({ error: 'originalUrl is required' });
    }

    try {
      const link = await createLink({ originalUrl, customSlug });
      return reply.status(201).send(link);
    } catch (err: any) {
      if (err.message === 'INVALID_URL') {
        return reply.status(400).send({ error: 'Invalid URL format' });
      }
      if (err.message === 'INVALID_SLUG') {
        return reply.status(400).send({ error: 'Invalid slug format' });
      }
      if (err.message === 'SLUG_TAKEN') {
        return reply.status(409).send({ error: 'Slug already taken' });
      }
      throw err;
    }
  });

  fastify.get('/api/links/:shortCode', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };
    const link = await getLinkBySlug(shortCode);

    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    return link;
  });
}