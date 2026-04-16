import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLinkBySlug, incrementClickCount } from '../services/link.service.js';

export async function redirectRoutes(fastify: FastifyInstance) {
  fastify.get('/:shortCode', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shortCode } = request.params as { shortCode: string };

    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const now = new Date();
    if (link.expiresAt && link.expiresAt < now) {
      return reply.status(410).send({ error: 'Link expired' });
    }

    if (link.maxClicks && link.clickCount >= link.maxClicks) {
      return reply.status(410).send({ error: 'Link clicks exhausted' });
    }

    await incrementClickCount(shortCode);

    reply.redirect(link.originalUrl, 302);
  });
}