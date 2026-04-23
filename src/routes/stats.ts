import { eq, sql } from 'drizzle-orm';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getLinkBySlug } from '../services/link.service.js';
import { db, links, clicks } from '../db/index.js';

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/links/:shortCode/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shortCode } = request.params as { shortCode: string };
    
    const link = await getLinkBySlug(shortCode);
    if (!link) {
      return reply.status(404).send({ error: 'Link not found' });
    }

    const totalClicks = db.select({ count: sql<number>`count(*)` }).from(clicks)
      .where(eq(clicks.linkId, link.id)).get();

    const clicksByReferrer = db.select({
      referrer: clicks.referrer,
      count: sql<number>`count(*)`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.referrer)
      .all();

    const clicksByDevice = db.select({
      device: clicks.device,
      count: sql<number>`count(*)`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.device)
      .all();

    const clicksByCountry = db.select({
      country: clicks.country,
      count: sql<number>`count(*)`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.country)
      .all();

    const clicksByOs = db.select({
      os: clicks.os,
      count: sql<number>`count(*)`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.os)
      .all();

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const clicksOverTime = db.select({
      date: sql<string>`date(clickedAt, 'unixepoch')`,
      count: sql<number>`count(*)`,
    }).from(clicks)
      .where(sql`${clicks.linkId} = ${link.id} AND ${clicks.clickedAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`date(clickedAt, 'unixepoch')`)
      .orderBy(sql`date(clickedAt, 'unixepoch')`)
      .all();

    return {
      shortCode,
      totalClicks: totalClicks?.count || 0,
      clicksByReferrer: clicksByReferrer.map(r => ({ referrer: r.referrer || 'direct', count: r.count || 0 })),
      clicksByDevice: clicksByDevice.map(d => ({ device: d.device || 'unknown', count: d.count || 0 })),
      clicksByCountry: clicksByCountry.map(c => ({ country: c.country || 'unknown', count: c.count || 0 })),
      clicksByOs: clicksByOs.map(o => ({ os: o.os || 'unknown', count: o.count || 0 })),
      clicksOverTime: clicksOverTime.map(t => ({ date: t.date, count: t.count || 0 })),
    };
  });
}