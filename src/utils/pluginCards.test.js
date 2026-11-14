import { describe, expect, it } from 'vitest';
import { pluginCards } from './pluginCards';

// صفحة «الإضافات»: بطاقة لكل شركة توصيل، مع حسابات المتجر المربوطة بها
const providers = [
  { name: 'Yalidine', title: 'Yalidine' },
  { name: 'ZRExpress', title: 'ZR Express' },
  { name: 'Maystro', title: 'Maystro Delivery' },
];
const accounts = [
  { id: 'a1', providerName: 'ZRExpress', accountName: 'ZR main' },
  { id: 'a2', providerName: 'ZRExpress', accountName: 'ZR 2' },
  { id: 'a3', providerName: 'Gone', accountName: 'old' },
];

describe('pluginCards', () => {
  it('one card per company, in the providers order, with its linked accounts', () => {
    const cards = pluginCards(providers, accounts);
    expect(cards.map((c) => c.provider.name)).toEqual(['Yalidine', 'ZRExpress', 'Maystro']);
    expect(cards[1].accounts.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(cards[1].connected).toBe(true);
    expect(cards[0].connected).toBe(false);
    expect(cards[0].accounts).toEqual([]);
  });

  it('search matches the title or the internal name, ignoring case and spaces around', () => {
    expect(pluginCards(providers, accounts, { query: '  zr ' }).map((c) => c.provider.name)).toEqual(['ZRExpress']);
    expect(pluginCards(providers, accounts, { query: 'delivery' }).map((c) => c.provider.name)).toEqual(['Maystro']);
    expect(pluginCards(providers, accounts, { query: 'maystro' }).map((c) => c.provider.name)).toEqual(['Maystro']);
  });

  it('the "connected" filter keeps only companies with an account', () => {
    expect(pluginCards(providers, accounts, { filter: 'connected' }).map((c) => c.provider.name)).toEqual(['ZRExpress']);
  });

  it('missing lists from a failed request give no cards and no crash', () => {
    expect(pluginCards(undefined, undefined)).toEqual([]);
    expect(pluginCards(providers, null).every((c) => !c.connected)).toBe(true);
  });
});
