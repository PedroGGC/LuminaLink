import { PrismaClient } from '@prisma/client';
import { generateSlug, isValidSlug } from '../utils/slug.js';

const prisma = new PrismaClient();

export interface CreateLinkInput {
  originalUrl: string;
  customSlug?: string;
}

export interface LinkResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  expiresAt?: Date;
  maxClicks?: number;
  createdAt: Date;
}

export async function createLink(input: CreateLinkInput): Promise<LinkResponse> {
  const { originalUrl, customSlug } = input;

  try {
    new URL(originalUrl);
  } catch {
    throw new Error('INVALID_URL');
  }

  let shortCode: string;
  let isCustom = false;

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
    },
  });

  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:3000/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
    createdAt: link.createdAt,
  };
}

export async function getLinkBySlug(shortCode: string): Promise<LinkResponse | null> {
  const link = await prisma.link.findUnique({ where: { shortCode } });
  if (!link) return null;

  return {
    id: link.id,
    shortCode: link.shortCode,
    shortUrl: `http://localhost:3000/${link.shortCode}`,
    originalUrl: link.originalUrl,
    clickCount: link.clickCount,
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

export { prisma };