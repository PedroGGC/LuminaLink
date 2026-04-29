import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql, inArray } from 'drizzle-orm';
import { db, links, clicks, sessions } from '../db/index.js';

async function getAuthUserId(request: FastifyRequest): Promise<string | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const session = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1).then(res => res[0]);
  if (!session || (session.expiresAt ?? new Date(0)) < new Date()) return null;
  return session.userId;
}

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // All user links
    const userLinks = await db.select().from(links).where(eq(links.userId, userId));
    const linkIds = userLinks.map((l: any) => l.id);

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
    const totalClicksRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(clicks)
      .where(inArray(clicks.linkId, linkIds))
      .limit(1).then(res => res[0]);
    const totalClicks = totalClicksRow?.count ?? 0;

    // Top link (by clickCount column — already denormalized)
    const sortedLinks = [...userLinks].sort((a: any, b: any) => (b.clickCount ?? 0) - (a.clickCount ?? 0));
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
      const timeAgoDate = new Date(startDate.getTime());
      
      const clickTrafficRaw = await db
        .select({
          month: sql<string>`to_char(${clicks.clickedAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
        })
        .from(clicks)
        .where(
          sql`${clicks.linkId} IN (${sql.join(linkIds.map((id: string) => sql`${id}`), sql`, `)}) AND ${clicks.clickedAt} >= ${timeAgoDate.toISOString()}`
        )
        .groupBy(sql`to_char(${clicks.clickedAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${clicks.clickedAt}, 'YYYY-MM')`);
        
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
      const timeAgoDate = new Date(startDate.getTime());
      
      const clickTrafficRaw = await db
        .select({
          year: sql<string>`to_char(${clicks.clickedAt}, 'YYYY')`,
          count: sql<number>`count(*)::int`,
        })
        .from(clicks)
        .where(
          sql`${clicks.linkId} IN (${sql.join(linkIds.map((id: string) => sql`${id}`), sql`, `)}) AND ${clicks.clickedAt} >= ${timeAgoDate.toISOString()}`
        )
        .groupBy(sql`to_char(${clicks.clickedAt}, 'YYYY')`)
        .orderBy(sql`to_char(${clicks.clickedAt}, 'YYYY')`);
        
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
      const timeAgoDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000);
      const clickTrafficRaw = await db
        .select({
          date: sql<string>`to_char(${clicks.clickedAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(clicks)
        .where(
          sql`${clicks.linkId} IN (${sql.join(linkIds.map((id: string) => sql`${id}`), sql`, `)}) AND ${clicks.clickedAt} >= ${timeAgoDate.toISOString()}`
        )
        .groupBy(sql`to_char(${clicks.clickedAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${clicks.clickedAt}, 'YYYY-MM-DD')`);

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
    const locationsRaw = await db
      .select({
        country: sql<string>`COALESCE(${clicks.country}, 'Unknown')`,
        count: sql<number>`count(*)::int`,
      })
      .from(clicks)
      .where(
        sql`${clicks.linkId} IN (${sql.join(linkIds.map((id: string) => sql`${id}`), sql`, `)})`
      )
      .groupBy(sql`COALESCE(${clicks.country}, 'Unknown')`)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    const topLocations = locationsRaw.map((r: any) => ({
      country: r.country,
      count: r.count,
      percent: totalClicks > 0 ? Math.round((r.count / totalClicks) * 100) : 0,
    }));

    // Device breakdown
    const devicesRaw = await db
      .select({
        device: clicks.device,
        count: sql<number>`count(*)::int`,
      })
      .from(clicks)
      .where(
        sql`${clicks.linkId} IN (${sql.join(linkIds.map((id: string) => sql`${id}`), sql`, `)})`
      )
      .groupBy(clicks.device)
      .orderBy(sql`count(*) DESC`);

    const deviceBreakdown = devicesRaw.map((d: any) => ({
      device: d.device || 'Unknown',
      count: d.count,
      percent: totalClicks > 0 ? Math.round((d.count / totalClicks) * 100) : 0,
    }));

    // Recent links (last 5 created)
    const recentLinks = [...userLinks]
      .sort((a: any, b: any) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, 5)
      .map((l: any) => ({
        id: l.id,
        shortCode: l.shortCode,
        originalUrl: l.originalUrl,
        clickCount: l.clickCount ?? 0,
        createdAt: l.createdAt?.getTime() ?? 0,
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
