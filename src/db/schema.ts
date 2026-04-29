import { pgTable, text, integer, timestamp, index, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  passwordHash: text('passwordHash').notNull(),
  plan: text('plan').default('free'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
}, (table) => ({
  emailIdx: index('idx_user_email').on(table.email),
}));

export const links = pgTable('links', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull(), // Assuming it links to users.id
  shortCode: text('shortCode').notNull(),
  originalUrl: text('originalUrl').notNull(),
  customCode: integer('customCode').default(0),
  hasPassword: integer('hasPassword').default(0),
  passwordHash: text('passwordHash'),
  expiresAt: timestamp('expiresAt', { mode: 'date' }),
  maxClicks: integer('maxClicks'),
  clickCount: integer('clickCount').default(0),
  showPreview: integer('showPreview').default(0),
  isActive: integer('isActive').default(1),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
}, (table) => ({
  shortCodeIdx: index('idx_link_shortCode').on(table.shortCode),
  userIdIdx: index('idx_link_userId').on(table.userId),
}));

export const clicks = pgTable('clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  linkId: uuid('linkId').notNull(), // Assuming it links to links.id
  clickedAt: timestamp('clickedAt', { mode: 'date' }).defaultNow(),
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

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull(), // Assuming it links to users.id
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expiresAt', { mode: 'date' }),
}, (table) => ({
  tokenIdx: index('idx_session_token').on(table.token),
}));
