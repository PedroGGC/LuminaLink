import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://shorten:shorten@localhost:5432/shorten';

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export const users = schema.users;
export const links = schema.links;
export const clicks = schema.clicks;
export const sessions = schema.sessions;
