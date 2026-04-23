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
  const { queueClick } = await import('./click-worker.js');
  return queueClick(input.linkId, {
    referrer: input.referrer,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
    country: input.country,
    city: input.city,
    device: input.device,
    os: input.os,
  });
}