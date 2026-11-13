import { describe, expect, it } from 'vitest';
import { SOURCE_KEYS, sourceMeta, rate } from './sources';

describe('order sources', () => {
  it('every channel the server knows has a label and color', () => {
    expect(SOURCE_KEYS).toEqual(['facebook', 'instagram', 'tiktok', 'google', 'youtube', 'snapchat', 'whatsapp', 'bing', 'twitter', 'direct', 'other', 'unknown']);
    SOURCE_KEYS.forEach((k) => expect(sourceMeta(k).color).toMatch(/^#/));
  });
  it('an unknown value falls back to other', () => expect(sourceMeta('weird').key).toBe('other'));
  it('rate in % (0 when nothing)', () => {
    expect(rate(1, 4)).toBe(25);
    expect(rate(0, 0)).toBe(0);
  });
});
