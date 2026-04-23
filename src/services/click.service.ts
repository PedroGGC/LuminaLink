import { db, clicks as clicksTable } from '../db/index.js';

export interface CreateClickInput {
  linkId: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  device?: string;
  os?: string;
}

export async function createClick(input: CreateClickInput) {
  return db.insert(clicksTable).values({
    linkId: input.linkId,
    clickedAt: Date.now(),
    referrer: input.referrer || null,
    userAgent: input.userAgent || null,
    ipAddress: input.ipAddress || null,
    country: input.country || null,
    city: input.city || null,
    device: input.device || null,
    os: input.os || null,
  }).run();
}