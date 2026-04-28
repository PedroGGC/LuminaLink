import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql, inArray } from 'drizzle-orm';
import { db, links, clicks, sessions } from '../db/index.js';

function getAuthUserId(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const session = db.select().from(sessions).where(eq(sessions.token, token)).get();
  if (!session || (session.expiresAt ?? 0) < Date.now()) return null;
  return session.userId;
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getAuthUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // All user links
    const userLinks = db.select().from(links).where(eq(links.userId, userId)).all();
    const linkIds = userLinks.map(l => l.id);

    if (linkIds.length === 0) {
      return {
        totalLinks: 0,
        totalClicks: 0,
        topLink: null,
        clickTraffic: [],
        topLocations: [],
        deviceBreakdown: [],
        recentLinks: [],
      };
    }

    // Total clicks across all user links
    const totalClicksRow = db
      .select({ count: sql<number>`count(*)` })
      .from(clicks)
      .where(inArray(clicks.linkId, linkIds))
      .get();
    const totalClicks = totalClicksRow?.count ?? 0;

    // Top link (by clickCount column — already denormalized)
    const sortedLinks = [...userLinks].sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0));
    const topLinkRow = sortedLinks[0] ?? null;
    const topLink = topLinkRow
      ? {
          shortCode: topLinkRow.shortCode,
          originalUrl: topLinkRow.originalUrl,
          clicks: topLinkRow.clickCount ?? 0,
        }
      : null;

    const range = (request.query as any).range || 'week';

    let clickTraffic: { label: string; count: number; dateStr?: string }[] = [];

    if (range === 'month') {
      // Last 12 months
      const monthsToFetch = 12;
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const timeAgo = startDate.getTime();
      
      const clickTrafficRaw = db
        .select({
          month: sql<string>`strftime('%Y-%m', datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(
          sql`${clicks.linkId} IN (${sql.join(linkIds.map(id => sql`${id}`), sql`, `)}) AND ${clicks.clickedAt} >= ${timeAgo}`
        )
        .groupBy(sql`strftime('%Y-%m', datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`)
        .orderBy(sql`strftime('%Y-%m', datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`)
        .all();
        
      const trafficMap = new Map<string, number>();
      for (const row of clickTrafficRaw) trafficMap.set(row.month, row.count);
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        clickTraffic.push({ label: monthNames[d.getMonth()], count: trafficMap.get(monthStr) ?? 0 });
      }
    } else if (range === 'year') {
      // Last 10 years
      const yearsToFetch = 10;
      const now = new Date();
      const startDate = new Date(now.getFullYear() - 9, 0, 1);
      const timeAgo = startDate.getTime();
      
      const clickTrafficRaw = db
        .select({
          year: sql<string>`strftime('%Y', datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(
          sql`${clicks.linkId} IN (${sql.join(linkIds.map(id => sql`${id}`), sql`, `)}) AND ${clicks.clickedAt} >= ${timeAgo}`
        )
        .groupBy(sql`strftime('%Y', datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`)
        .orderBy(sql`strftime('%Y', datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`)
        .all();
        
      const trafficMap = new Map<string, number>();
      for (const row of clickTrafficRaw) trafficMap.set(row.year, row.count);
      
      for (let i = yearsToFetch - 1; i >= 0; i--) {
        const y = now.getFullYear() - i;
        const yearStr = y.toString();
        clickTraffic.push({ label: yearStr, count: trafficMap.get(yearStr) ?? 0 });
      }
    } else {
      // Default: week (7 days)
      const daysToFetch = 7;
      const timeAgo = Date.now() - daysToFetch * 24 * 60 * 60 * 1000;
      const clickTrafficRaw = db
        .select({
          date: sql<string>`date(datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(
          sql`${clicks.linkId} IN (${sql.join(linkIds.map(id => sql`${id}`), sql`, `)}) AND ${clicks.clickedAt} >= ${timeAgo}`
        )
        .groupBy(sql`date(datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`)
        .orderBy(sql`date(datetime(${clicks.clickedAt} / 1000, 'unixepoch'))`)
        .all();

      const trafficMap = new Map<string, number>();
      for (const row of clickTrafficRaw) trafficMap.set(row.date, row.count);
      
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = daysToFetch - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        clickTraffic.push({ label: dayLabels[d.getDay()], count: trafficMap.get(dateStr) ?? 0, dateStr });
      }
    }

    // Top locations
    const locationsRaw = db
      .select({
        country: sql<string>`COALESCE(${clicks.country}, 'Unknown')`,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(
        sql`${clicks.linkId} IN (${sql.join(linkIds.map(id => sql`${id}`), sql`, `)})`
      )
      .groupBy(sql`COALESCE(${clicks.country}, 'Unknown')`)
      .orderBy(sql`count(*) DESC`)
      .limit(5)
      .all();

    const topLocations = locationsRaw.map(r => ({
      country: r.country,
      count: r.count,
      percent: totalClicks > 0 ? Math.round((r.count / totalClicks) * 100) : 0,
    }));

    // Device breakdown
    const devicesRaw = db
      .select({
        device: clicks.device,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(
        sql`${clicks.linkId} IN (${sql.join(linkIds.map(id => sql`${id}`), sql`, `)})`
      )
      .groupBy(clicks.device)
      .orderBy(sql`count(*) DESC`)
      .all();

    const deviceBreakdown = devicesRaw.map(d => ({
      device: d.device || 'Unknown',
      count: d.count,
      percent: totalClicks > 0 ? Math.round((d.count / totalClicks) * 100) : 0,
    }));

    // Recent links (last 5 created)
    const recentLinks = [...userLinks]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 5)
      .map(l => ({
        id: l.id,
        shortCode: l.shortCode,
        originalUrl: l.originalUrl,
        clickCount: l.clickCount ?? 0,
        createdAt: l.createdAt,
      }));

    return {
      totalLinks: userLinks.length,
      totalClicks,
      topLink,
      clickTraffic,
      topLocations,
      deviceBreakdown,
      recentLinks,
    };
  });
}
