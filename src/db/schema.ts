import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const links = sqliteTable('links', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shortCode: text('shortCode').unique().notNull(),
  originalUrl: text('originalUrl').notNull(),
  customCode: integer('customCode').default(0),
  hasPassword: integer('hasPassword').default(0),
  passwordHash: text('passwordHash'),
  expiresAt: integer('expiresAt'),
  maxClicks: integer('maxClicks'),
  clickCount: integer('clickCount').default(0),
  showPreview: integer('showPreview').default(0),
  isActive: integer('isActive').default(1),
  createdAt: integer('createdAt'),
  updatedAt: integer('updatedAt'),
}, (table) => ({
  shortCodeIdx: index('idx_link_shortCode').on(table.shortCode),
}));

export const clicks = sqliteTable('clicks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  linkId: text('linkId').notNull(),
  clickedAt: integer('clickedAt'),
  referrer: text('referrer'),
  userAgent: text('userAgent'),
  ipAddress: text('ipAddress'),
  country: text('country'),
  city: text('city'),
  device: text('device'),
  os: text('os'),
}, (table) => ({
  linkIdIdx: index('idx_click_linkId').on(table.linkId),
  clickedAtIdx: index('idx_click_clickedAt').on(table.clickedAt),
}));