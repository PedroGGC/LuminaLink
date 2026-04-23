import 'dotenv/config'; // Garante que o .env seja lido
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 2;

export function getRedis(): Redis | null {
  if (!redis && connectionAttempts < MAX_RETRIES) {
    try {
      redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Removido o tls: {} para não conflitar com a URL do Redis Cloud
      });

      redis.on('error', (err) => {
        connectionAttempts++;
        if (connectionAttempts >= MAX_RETRIES) {
          console.warn('[Redis] Connection failed, disabling cache', err.message);
          redis?.disconnect();
          redis = null;
        }
      });

      redis.on('close', () => {
        redis = null;
      });

      redis.connect().catch((err) => {
        console.error('[Redis] Erro no connect:', err.message);
        connectionAttempts++;
      });
    } catch {
      return null;
    }
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    connectionAttempts = 0;
  }
}