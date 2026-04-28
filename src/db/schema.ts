import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  passwordHash: text('passwordHash').notNull(),
  plan: text('plan').default('free'),
  createdAt: integer('createdAt'),
}, (table) => ({
  emailIdx: index('idx_user_email').on(table.email),
}));

export const links = sqliteTable('links', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  shortCode: text('shortCode').notNull(),
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
  userIdIdx: index('idx_link_userId').on(table.userId),
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

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  token: text('token').unique().notNull(),
  expiresAt: integer('expiresAt'),
}, (table) => ({
  tokenIdx: index('idx_session_token').on(table.token),
}));