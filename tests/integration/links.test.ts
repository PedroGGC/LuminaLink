import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { linkRoutes } from '../../src/routes/links.js';

describe('Link Management Integration', () => {
  let app: any;
  
  beforeAll(async () => {
    app = Fastify({ logger: true });
    await app.register(linkRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/links', () => {
    it('creates link without password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/links',
        payload: { originalUrl: 'https://example.com' },
      });
      expect(response.statusCode).toBe(201);
    });

    it('creates link with password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/links',
        payload: { originalUrl: 'https://test.com', password: '123' },
      });
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.hasPassword).toBe(true);
    });

    it('rejects blocked domain', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/links',
        payload: { originalUrl: 'https://evil.com' },
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/links/:shortCode', () => {
    it('updates link URL', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/api/links',
        payload: { originalUrl: 'https://original.com' },
      });
      const code = JSON.parse(create.body).shortCode;

      const update = await app.inject({
        method: 'PUT',
        url: `/api/links/${code}`,
        payload: { originalUrl: 'https://updated.com' },
      });
      expect(update.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/links/:shortCode', () => {
    it('deletes a link', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/api/links',
        payload: { originalUrl: 'https://delete.com' },
      });
      const code = JSON.parse(create.body).shortCode;

      const del = await app.inject({
        method: 'DELETE',
        url: `/api/links/${code}`,
      });
      expect(del.statusCode).toBe(200);
    });
  });
});