import { eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { verifyPassword } from '../utils/password.js';
import { db, links } from '../db/index.js';

export async function unlockRoutes(fastify: FastifyInstance) {
  fastify.post('/api/links/:shortCode/unlock', async (request, reply) => {
    const { shortCode } = request.params as { shortCode: string };
    const { password } = request.body as { password: string };

    if (!password) {
      return reply.status(400).send({ error: 'Password required' });
    }

    const link = db.select().from(links).where(eq(links.shortCode, shortCode)).get();
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    if (!link.hasPassword || !link.passwordHash) {
      return reply.status(400).send({ error: 'Link does not have password protection' });
    }

    const valid = await verifyPassword(password, link.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid password' });
    }

    reply.setCookie(`unlocked_${shortCode}`, 'true', { 
      path: '/', 
      maxAge: 10800, // 3 hours
      sameSite: 'lax',
    });

    return { success: true };
  });
}