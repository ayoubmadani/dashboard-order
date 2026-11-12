import { describe, expect, it } from 'vitest';
import { embedUrl } from './ThemeProductBlock';

describe('embedUrl', () => {
  it('the store preview page at the page width', () => {
    expect(embedUrl('dove-baby', 'P1', 720)).toBe('https://dove-baby.mdstore.top/embed/P1?w=720');
  });
  it('carries a block colour, but not "transparent" (= page background)', () => {
    expect(embedUrl('s', 'P1', 600, '#fff000')).toBe('https://s.mdstore.top/embed/P1?w=600&bg=%23fff000');
    expect(embedUrl('s', 'P1', 600, 'transparent')).toBe('https://s.mdstore.top/embed/P1?w=600');
  });
});
