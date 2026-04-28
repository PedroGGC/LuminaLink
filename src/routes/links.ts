import { FastifyInstance, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { db, links, sessions } from '../db/index.js';
import { createLink, getLinkBySlug, updateLink, deleteLink, getLinksByUser } from '../services/link.service.js';

function getUserId(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const session = db.select().from(sessions).where(eq(sessions.token, token)).get();
  if (!session || (session.expiresAt ?? 0) < Date.now()) return null;
  return session.userId;
}

export async function linkRoutes(fastify: FastifyInstance) {
  fastify.get('/api/links', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const userLinks = await getLinksByUser(userId);
    return userLinks;
  });

  fastify.post('/api/links', async (request, reply) => {
    const userId = getUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { originalUrl, customSlug, password } = request.body as { originalUrl: string; customSlug?: string; password?: string };

    if (!originalUrl) {
      return reply.status(400).send({ error: 'originalUrl is required' });
    }

    try {
      const link = await createLink({ originalUrl, customSlug, password }, userId);
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
    const userId = getUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { shortCode } = request.params as { shortCode: string };
    const { originalUrl } = request.body as { originalUrl: string };

    if (!originalUrl) {
      return reply.status(400).send({ error: 'originalUrl is required' });
    }

    try {
      const link = await updateLink(shortCode, originalUrl, userId);
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
    const userId = getUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { shortCode } = request.params as { shortCode: string };
    const deleted = await deleteLink(shortCode, userId);

    if (!deleted) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    return { success: true, message: 'Link deleted' };
  });
}