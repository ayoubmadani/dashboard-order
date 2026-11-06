import { describe, expect, it, vi } from 'vitest';
import { randomStoreCode, freshStoreCode } from './storeCode';

describe('store product code (4 chars, like the phone app)', () => {
  it('4 uppercase letters/digits, never O or I', () => {
    for (let i = 0; i < 300; i++) expect(randomStoreCode()).toMatch(/^[0-9A-HJ-NP-Z]{4}$/);
  });
  it('freshStoreCode skips codes already used in the store (lookup 200) and keeps a free one (404)', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce({ data: { product: {} } })
      .mockRejectedValueOnce({ response: { status: 404 } });
    const code = await freshStoreCode(get);
    expect(code).toMatch(/^[0-9A-HJ-NP-Z]{4}$/);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
