import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, or } from 'drizzle-orm';
import { db, users, sessions } from '../db/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

declare module 'fastify' {
  interface FastifyInstance {
    sessionToken: string | null;
  }
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email?: string; name?: string; password?: string };
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return reply.status(400).send({ error: 'Email, name, and password are required' });
    }

    const existing = await db.select().from(users).where(or(eq(users.email, email), eq(users.name, name))).get();
    if (existing) {
      return reply.status(409).send({ error: 'Email or Username already registered' });
    }

    const passwordHash = await hashPassword(password);
    const user = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      plan: 'free',
      createdAt: Date.now(),
    }).returning().get();

    const token = generateToken();
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    reply.status(201).send({ 
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
      token 
    });
  });

  fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { identifier?: string; password?: string };
    const { identifier, password } = body;

    if (!identifier || !password) {
      return reply.status(400).send({ error: 'Email/Username and password are required' });
    }

    const user = await db.select().from(users).where(or(eq(users.email, identifier), eq(users.name, identifier))).get();
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    reply.send({ 
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
      token 
    });
  });

  fastify.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    const session = await db.select().from(sessions).where(eq(sessions.token, token)).get();
    
    if (!session || (session.expiresAt ?? 0) < Date.now()) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }

    reply.send({ user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  });

  fastify.post('/api/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    reply.send({ success: true });
  });
}