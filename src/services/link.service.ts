import { eq } from 'drizzle-orm';
import { db, links as linksTable } from '../db/index.js';
import { generateSlug, isValidSlug } from '../utils/slug.js';
import { isDomainBlocked } from '../utils/blacklist.js';
import { hashPassword } from '../utils/password.js';
import { getRedis } from '../db/redis.js';

export interface CreateLinkInput {
  originalUrl: string;
  customSlug?: string;
  password?: string;
}

export interface LinkResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  hasPassword: boolean;
  expiresAt: number | null;
  maxClicks?: number;
  createdAt?: number;
}

const PORT = parseInt(process.env.PORT || '3002');
const CACHE_TTL = 3600;

function mapLinkToResponse(link: any): LinkResponse {
  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:${PORT}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount || 0,
    hasPassword: Boolean(link.hasPassword),
    expiresAt: link.expiresAt?.getTime() ?? null,
    maxClicks: link.maxClicks || undefined,
    createdAt: link.createdAt?.getTime() ?? null,
  };
}

function getRedisSafe() {
  try {
    const r = getRedis();
    if (!r) return null;
    if (r.status !== 'ready' && r.status !== 'connect') return null;
    return r;
  } catch {
    return null;
  }
}

export async function getCachedUrl(shortCode: string): Promise<string | null> {
  const redis = getRedisSafe();
  if (!redis) return null;
  try {
    return await redis.get(`url:${shortCode}`);
  } catch {
    return null;
  }
}

export async function cacheUrl(shortCode: string, originalUrl: string): Promise<void> {
  const redis = getRedisSafe();
  if (!redis) return;
  try {
    await redis.setex(`url:${shortCode}`, CACHE_TTL, originalUrl);
  } catch {
    // Ignore
  }
}

export async function invalidateCache(shortCode: string): Promise<void> {
  const redis = getRedisSafe();
  if (!redis) return;
  try {
    await redis.del(`url:${shortCode}`);
  } catch {
    // Ignore
  }
}

export async function createLink(input: CreateLinkInput, userId?: string): Promise<LinkResponse> {
  const { originalUrl, customSlug, password } = input;

  try {
    new URL(originalUrl);
  } catch {
    throw new Error('INVALID_URL');
  }

  if (isDomainBlocked(originalUrl)) {
    throw new Error('DOMAIN_BLOCKED');
  }

  let shortCode: string;
  let isCustom = false;
  let passwordHash: string | undefined;

  if (password) {
    passwordHash = await hashPassword(password);
  }

  if (customSlug) {
    if (!isValidSlug(customSlug)) {
      throw new Error('INVALID_SLUG');
    }
    const existing = await db.select().from(linksTable).where(eq(linksTable.shortCode, customSlug)).limit(1).then(res => res[0]);
    if (existing) {
      throw new Error('SLUG_TAKEN');
    }
    shortCode = customSlug;
    isCustom = true;
  } else {
    let attempts = 0;
    let found = true;
    do {
      shortCode = generateSlug();
      attempts++;
      const existing = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
      found = !!existing;
    } while (attempts < 10 && found);
  }

  const now = new Date();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  await db.insert(linksTable).values({
    userId: userId || 'anonymous',
    shortCode,
    originalUrl,
    customCode: isCustom ? 1 : 0,
    hasPassword: password ? 1 : 0,
    passwordHash: passwordHash || null,
    expiresAt: new Date(now.getTime() + SEVEN_DAYS),
    clickCount: 0,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });

  const newLink = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
  if (!newLink) throw new Error('CREATE_FAILED');

  await cacheUrl(shortCode, originalUrl);

  return mapLinkToResponse(newLink);
}

export async function getLinkBySlug(shortCode: string): Promise<LinkResponse | null> {
  const link = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
  if (!link) return null;
  if (!link.isActive) return null;

  // Try to sync cache
  try {
    const cached = await getCachedUrl(shortCode);
    if (cached !== link.originalUrl) {
      await cacheUrl(shortCode, link.originalUrl);
    }
  } catch {
    // Ignore cache
  }

  return mapLinkToResponse(link);
}

export async function incrementClickCount(shortCode: string): Promise<void> {
  const link = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
  if (!link) return;

  await db.update(linksTable)
    .set({ clickCount: (link.clickCount || 0) + 1 })
    .where(eq(linksTable.shortCode, shortCode));
}

export async function updateLink(shortCode: string, originalUrl: string, userId?: string): Promise<LinkResponse | null> {
  const existing = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
  if (!existing) return null;
  if (userId && existing.userId !== userId) return null;

  if (isDomainBlocked(originalUrl)) {
    throw new Error('DOMAIN_BLOCKED');
  }

  await db.update(linksTable)
    .set({ originalUrl, isActive: 1, updatedAt: new Date() })
    .where(eq(linksTable.shortCode, shortCode));

  await cacheUrl(shortCode, originalUrl);

  const link = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
  if (!link) return null;

  return mapLinkToResponse(link);
}

export async function deleteLink(shortCode: string, userId?: string): Promise<boolean> {
  const existing = await db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).limit(1).then(res => res[0]);
  if (!existing) return false;
  if (userId && existing.userId !== userId) return false;

  await db.delete(linksTable)
    .where(eq(linksTable.shortCode, shortCode));

  await invalidateCache(shortCode);

  return true;
}

export async function getLinksByUser(userId: string): Promise<LinkResponse[]> {
  const userLinks = await db.select().from(linksTable)
    .where(eq(linksTable.userId, userId));
  return userLinks.filter((l: any) => l.isActive).map(mapLinkToResponse);
}

export async function cleanupExpiredLinks(): Promise<number> {
  const now = new Date();
  const userLinks = await db.select().from(linksTable)
    .where(eq(linksTable.isActive, 1));
  const expired = userLinks.filter((l: any) => l.expiresAt && l.expiresAt < now);
  
  for (const l of expired) {
    await db.delete(linksTable)
      .where(eq(linksTable.shortCode, l.shortCode));
    await invalidateCache(l.shortCode);
  }
  
  if (expired.length > 0) {
    console.log(`[Cleanup] Removed ${expired.length} expired links`);
  }
  return expired.length;
}