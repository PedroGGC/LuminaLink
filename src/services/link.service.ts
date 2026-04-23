import { eq } from 'drizzle-orm';
import { db, links as linksTable } from '../db/index.js';
import { generateSlug, isValidSlug } from '../utils/slug.js';
import { isDomainBlocked } from '../utils/blacklist.js';
import { hashPassword } from '../utils/password.js';

const PORT = parseInt(process.env.PORT || '3002');

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
  expiresAt?: Date;
  maxClicks?: number;
  createdAt: Date;
}

function mapLinkToResponse(link: any): LinkResponse {
  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:${PORT}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount || 0,
    hasPassword: Boolean(link.hasPassword),
    expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
    maxClicks: link.maxClicks || undefined,
    createdAt: new Date(link.createdAt),
  };
}

export async function createLink(input: CreateLinkInput): Promise<LinkResponse> {
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
    const existing = db.select().from(linksTable).where(eq(linksTable.shortCode, customSlug)).get();
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
      const existing = db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).get();
      found = !!existing;
    } while (attempts < 10 && found);
  }

  const now = Date.now();
  db.insert(linksTable).values({
    shortCode,
    originalUrl,
    customCode: isCustom ? 1 : 0,
    hasPassword: password ? 1 : 0,
    passwordHash: passwordHash || null,
    clickCount: 0,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  }).run();

  const newLink = db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).get();
  if (!newLink) throw new Error('CREATE_FAILED');

  return mapLinkToResponse(newLink);
}

export async function getLinkBySlug(shortCode: string): Promise<LinkResponse | null> {
  const link = db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).get();
  if (!link) return null;

  return mapLinkToResponse(link);
}

export async function incrementClickCount(shortCode: string): Promise<void> {
  const link = db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).get();
  if (!link) return;

  db.update(linksTable)
    .set({ clickCount: (link.clickCount || 0) + 1 })
    .where(eq(linksTable.shortCode, shortCode))
    .run();
}

export async function updateLink(shortCode: string, originalUrl: string): Promise<LinkResponse | null> {
  if (isDomainBlocked(originalUrl)) {
    throw new Error('DOMAIN_BLOCKED');
  }

  db.update(linksTable)
    .set({ originalUrl, isActive: 1, updatedAt: Date.now() })
    .where(eq(linksTable.shortCode, shortCode))
    .run();

  const link = db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).get();
  if (!link) return null;

  return mapLinkToResponse(link);
}

export async function deleteLink(shortCode: string): Promise<boolean> {
  const existing = db.select().from(linksTable).where(eq(linksTable.shortCode, shortCode)).get();
  if (!existing) return false;

  db.update(linksTable)
    .set({ isActive: 0 })
    .where(eq(linksTable.shortCode, shortCode))
    .run();

  return true;
}