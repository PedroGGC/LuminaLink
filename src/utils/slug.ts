import crypto from 'crypto';

const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RESERVED = ['admin', 'api', 'health', 'stats', 'preview', 'qr'];

export function generateSlug(length: number = 6): string {
  const bytes = crypto.randomBytes(length);
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += CHARS[bytes[i] % CHARS.length];
  }
  return slug;
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 20) return false;
  if (!/^[a-zA-Z0-9-]+$/.test(slug)) return false;
  if (RESERVED.includes(slug.toLowerCase())) return false;
  return true;
}