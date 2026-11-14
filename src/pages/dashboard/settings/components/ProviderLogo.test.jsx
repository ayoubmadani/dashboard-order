// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ProviderLogo from './ProviderLogo';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mount = (props) => {
  const el = document.createElement('div');
  act(() => createRoot(el).render(<ProviderLogo box="w-8 h-8" {...props} />));
  return el;
};

// شعار شركة التوصيل: لا صورة مكسورة أبداً — رابط فاشل أو غائب = أيقونة الشاحنة
describe('ProviderLogo', () => {
  it('shows the logo while it loads', () => {
    expect(mount({ logo: 'https://x/logo.png' }).querySelector('img')?.getAttribute('src')).toBe('https://x/logo.png');
  });

  it('a logo that fails to load is replaced by the truck icon', () => {
    const el = mount({ logo: 'https://cdn1.ecotrack.dz/gone.png' });
    act(() => el.querySelector('img').dispatchEvent(new Event('error')));
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('no logo or "#" → truck icon', () => {
    for (const logo of [undefined, '', '#']) {
      const el = mount({ logo });
      expect(el.querySelector('img')).toBeNull();
      expect(el.querySelector('svg')).not.toBeNull();
    }
  });
});
