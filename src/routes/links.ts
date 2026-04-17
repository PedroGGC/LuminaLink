import { FastifyInstance } from 'fastify';
import { createLink, getLinkBySlug, updateLink, deleteLink } from '../services/link.service.js';

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
      if (err.message === 'DOMAIN_BLOCKED') {
        return reply.status(403).send({ error: 'Domain blocked' });
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

  fastify.put('/api/links/:shortCode', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };
    const { originalUrl } = request.body as { originalUrl: string };

    if (!originalUrl) {
      return reply.status(400).send({ error: 'originalUrl is required' });
    }

    try {
      const link = await updateLink(shortCode, originalUrl);
      if (!link) {
        return reply.status(404).send({ error: 'Link not found' });
      }
      return link;
    } catch (err: any) {
      if (err.message === 'DOMAIN_BLOCKED') {
        return reply.status(403).send({ error: 'Domain blocked' });
      }
      throw err;
    }
  });

  fastify.delete('/api/links/:shortCode', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };
    const deleted = await deleteLink(shortCode);

    if (!deleted) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    return { success: true, message: 'Link deleted' };
  });
}