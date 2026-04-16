import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildUTMUrl } from '../../src/utils/utm.js';

describe('UTM', () => {
  describe('buildUTMUrl', () => {
    it('adds source parameter', () => {
      const url = buildUTMUrl('https://example.com', { source: 'google' });
      expect(url).toContain('utm_source=google');
    });

    it('adds medium parameter', () => {
      const url = buildUTMUrl('https://example.com', { medium: 'cpc' });
      expect(url).toContain('utm_medium=cpc');
    });

    it('adds multiple parameters', () => {
      const url = buildUTMUrl('https://example.com', {
        source: 'google',
        medium: 'cpc',
        campaign: 'summer',
      });
      expect(url).toContain('utm_source=google');
      expect(url).toContain('utm_medium=cpc');
      expect(url).toContain('utm_campaign=summer');
    });

    it('preserves original URL parameters', () => {
      const url = buildUTMUrl('https://example.com?ref=123', { source: 'google' });
      expect(url).toContain('ref=123');
      expect(url).toContain('utm_source=google');
    });
  });
});