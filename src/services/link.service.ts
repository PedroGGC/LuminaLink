import { PrismaClient } from '@prisma/client';
import { generateSlug, isValidSlug } from '../utils/slug.js';
import { isDomainBlocked } from '../utils/blacklist.js';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();
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
    const existing = await prisma.link.findUnique({ where: { shortCode: customSlug } });
    if (existing) {
      throw new Error('SLUG_TAKEN');
    }
    shortCode = customSlug;
    isCustom = true;
  } else {
    let attempts = 0;
    do {
      shortCode = generateSlug();
      attempts++;
    } while (attempts < 10 && await prisma.link.findUnique({ where: { shortCode } }));
  }

  const link = await prisma.link.create({
    data: {
      shortCode,
      originalUrl,
      customCode: isCustom,
      hasPassword: !!password,
      passwordHash: passwordHash,
    },
  });

  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:${PORT}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    hasPassword: link.hasPassword,
    createdAt: link.createdAt,
  };
}

export async function getLinkBySlug(shortCode: string): Promise<LinkResponse | null> {
  const link = await prisma.link.findUnique({ where: { shortCode } });
  if (!link) return null;

  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:${PORT}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    hasPassword: link.hasPassword,
    expiresAt: link.expiresAt || undefined,
    maxClicks: link.maxClicks || undefined,
    createdAt: link.createdAt,
  };
}

export async function incrementClickCount(shortCode: string): Promise<void> {
  await prisma.link.update({
    where: { shortCode },
    data: { clickCount: { increment: 1 } },
  });
}

export async function updateLink(shortCode: string, originalUrl: string): Promise<LinkResponse | null> {
  if (isDomainBlocked(originalUrl)) {
    throw new Error('DOMAIN_BLOCKED');
  }

  const link = await prisma.link.update({
    where: { shortCode },
    data: { originalUrl, isActive: true },
  });

  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:${PORT}/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    hasPassword: link.hasPassword,
    createdAt: link.createdAt,
  };
}

export async function deleteLink(shortCode: string): Promise<boolean> {
  const link = await prisma.link.findUnique({ where: { shortCode } });
  if (!link) return false;

  await prisma.link.update({
    where: { shortCode },
    data: { isActive: false },
  });

  return true;
}

export { prisma };