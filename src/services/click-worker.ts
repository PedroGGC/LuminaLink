import { db, clicks as clicksTable } from '../db/index.js';
import { getRedis } from '../db/redis.js';

const CLICK_QUEUE_KEY = 'clicks:pending';
const FLUSH_INTERVAL = 5000;

let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

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

export async function queueClick(linkId: string, data: {
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  device?: string;
  os?: string;
}): Promise<void> {
  writeClickDirect(linkId, data);
}

function writeClickDirect(linkId: string, data: any) {
  const now = Date.now();
  try {
    db.insert(clicksTable).values({
      linkId,
      clickedAt: now,
      referrer: data.referrer || null,
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
      country: data.country || null,
      city: data.city || null,
      device: data.device || null,
      os: data.os || null,
    }).run();
  } catch (err) {
    console.error('[ClickWorker] Direct insert failed:', err);
  }
}

export async function flushClicksToDb(): Promise<number> {
  const redis = getRedisSafe();
  if (!redis) return 0;

  if (isProcessing) return 0;
  isProcessing = true;

  try {
    const clicks = await redis.lrange(CLICK_QUEUE_KEY, 0, -1);
    if (clicks.length === 0) {
      isProcessing = false;
      return 0;
    }

    await redis.del(CLICK_QUEUE_KEY);

    for (const clickStr of clicks) {
      try {
        const click = JSON.parse(clickStr);
        writeClickDirect(click.linkId, click);
      } catch {
        // Skip invalid entries
      }
    }

    console.log(`[ClickWorker] Flushed ${clicks.length} clicks to DB`);
    isProcessing = false;
    return clicks.length;
  } catch (err: any) {
    console.error('[ClickWorker] Flush error:', err.message);
    isProcessing = false;
    return 0;
  }
}

export function startClickWorker(): void {
  if (workerInterval) return;
  
  workerInterval = setInterval(async () => {
    await flushClicksToDb();
  }, FLUSH_INTERVAL);
  
  console.log('[ClickWorker] Started, flushing every 5s');
}

export function stopClickWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[ClickWorker] Stopped');
  }
}