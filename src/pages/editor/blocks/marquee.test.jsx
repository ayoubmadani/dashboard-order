import { describe, expect, it } from 'vitest';
import { marqueeLayout, marqueeOf, marqueeRepeat, MARQUEE_DIRECTIONS } from './marquee';

// نسخة المحرر — يجب أن تطابق المتجر (mdstore-store/src/components/builderPages/marquee.test.ts)
describe('scrolling text (editor copy)', () => {
  it('direction / speed / repeat', () => {
    expect(marqueeOf({})).toBeNull();
    expect(MARQUEE_DIRECTIONS).toEqual(['none', 'rtl', 'ltr']);
    expect(marqueeOf({ marquee: 'ltr', marqueeSpeed: 1 })).toEqual({ dir: 'ltr', seconds: 3 });
    expect(marqueeRepeat({ marqueeRepeat: 99 })).toBe(10);
  });
  it('layout: band/N spacing, or text+gap when the text is longer', () => {
    expect(marqueeLayout({ band: 500, text: 100, gap: 40, repeat: 1, seconds: 10 })).toEqual({ spacing: 500, count: 2, duration: 10 });
    expect(marqueeLayout({ band: 500, text: 100, gap: 40, repeat: 2, seconds: 10 })).toEqual({ spacing: 250, count: 3, duration: 5 });
    expect(marqueeLayout({ band: 500, text: 400, gap: 40, repeat: 2, seconds: 10 })).toEqual({ spacing: 440, count: 3, duration: 8.8 });
    expect(marqueeLayout({ band: 0, text: 0, gap: 0, repeat: 1, seconds: 12 })).toBeNull();
  });
});
