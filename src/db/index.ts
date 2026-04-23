import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const dbPath = './src/db/dev.db';
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    shortCode TEXT UNIQUE NOT NULL,
    originalUrl TEXT NOT NULL,
    customCode INTEGER DEFAULT 0,
    hasPassword INTEGER DEFAULT 0,
    passwordHash TEXT,
    expiresAt INTEGER,
    maxClicks INTEGER,
    clickCount INTEGER DEFAULT 0,
    showPreview INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt INTEGER,
    updatedAt INTEGER
  );
  
  CREATE INDEX IF NOT EXISTS idx_link_shortCode ON links(shortCode);
  
  CREATE TABLE IF NOT EXISTS clicks (
    id TEXT PRIMARY KEY,
    linkId TEXT NOT NULL,
    clickedAt INTEGER,
    referrer TEXT,
    userAgent TEXT,
    ipAddress TEXT,
    country TEXT,
    city TEXT,
    device TEXT,
    os TEXT
  );
  
  CREATE INDEX IF NOT EXISTS idx_click_linkId ON clicks(linkId);
  CREATE INDEX IF NOT EXISTS idx_click_clickedAt ON clicks(clickedAt);
`);

export const db = drizzle(sqlite);

export const links = schema.links;
export const clicks = schema.clicks;