import { describe, it, expect } from 'vitest';
import { generateSlug, isValidSlug } from '../../src/utils/slug';

describe('slug', () => {
  describe('generateSlug', () => {
    it('generates slug of default length', () => {
      const slug = generateSlug();
      expect(slug).toHaveLength(6);
    });

    it('generates slug of custom length', () => {
      const slug = generateSlug(8);
      expect(slug).toHaveLength(8);
    });

    it('contains only valid characters', () => {
      const slug = generateSlug();
      expect(slug).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('isValidSlug', () => {
    it('returns true for valid slug', () => {
      expect(isValidSlug('abc123')).toBe(true);
      expect(isValidSlug('my-link')).toBe(true);
    });

    it('returns false for too short', () => {
      expect(isValidSlug('ab')).toBe(false);
    });

    it('returns false for too long', () => {
      expect(isValidSlug('a'.repeat(21))).toBe(false);
    });

    it('returns false for reserved words', () => {
      expect(isValidSlug('admin')).toBe(false);
      expect(isValidSlug('health')).toBe(false);
    });
  });
});