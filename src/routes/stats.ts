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

    const totalClicks = await db.select({ count: sql<number>`count(*)::int` }).from(clicks)
      .where(eq(clicks.linkId, link.id)).limit(1).then(res => res[0]);

    const clicksByReferrer = await db.select({
      referrer: clicks.referrer,
      count: sql<number>`count(*)::int`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.referrer);

    const clicksByDevice = await db.select({
      device: clicks.device,
      count: sql<number>`count(*)::int`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.device);

    const clicksByCountry = await db.select({
      country: clicks.country,
      count: sql<number>`count(*)::int`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.country);

    const clicksByOs = await db.select({
      os: clicks.os,
      count: sql<number>`count(*)::int`,
    }).from(clicks)
      .where(eq(clicks.linkId, link.id))
      .groupBy(clicks.os);

    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    const clicksOverTime = await db.select({
      date: sql<string>`to_char(${clicks.clickedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    }).from(clicks)
      .where(sql`${clicks.linkId} = ${link.id} AND ${clicks.clickedAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`to_char(${clicks.clickedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${clicks.clickedAt}, 'YYYY-MM-DD')`);

    return {
      shortCode,
      totalClicks: totalClicks?.count || 0,
      clicksByReferrer: clicksByReferrer.map((r: any) => ({ referrer: r.referrer || 'direct', count: r.count || 0 })),
      clicksByDevice: clicksByDevice.map((d: any) => ({ device: d.device || 'unknown', count: d.count || 0 })),
      clicksByCountry: clicksByCountry.map((c: any) => ({ country: c.country || 'unknown', count: c.count || 0 })),
      clicksByOs: clicksByOs.map((o: any) => ({ os: o.os || 'unknown', count: o.count || 0 })),
      clicksOverTime: clicksOverTime.map((t: any) => ({ date: t.date, count: t.count || 0 })),
    };
  });
}