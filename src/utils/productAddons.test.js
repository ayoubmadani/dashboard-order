import { describe, expect, it } from 'vitest';
import { addonsPayload } from './productAddons';

// الإضافات عند الحفظ: سعر فارغ = 0، كمية فارغة = 1، والأسطر بلا اسم تُتجاهل
describe('addonsPayload', () => {
  it('empty price is 0 and empty max quantity is 1', () => {
    expect(addonsPayload([{ id: 'a', name: ' جبن ', price: '', maxQty: '' }])).toEqual([
      { id: 'a', name: 'جبن', price: 0, isActive: true, maxQty: 1 },
    ]);
  });
  it('keeps what the merchant typed, max quantity between 1 and 99', () => {
    expect(addonsPayload([{ id: 'b', name: 'صلصة', price: '150', maxQty: '3', isActive: false }])[0]).toEqual({ id: 'b', name: 'صلصة', price: 150, isActive: false, maxQty: 3 });
    expect(addonsPayload([{ id: 'c', name: 'x', maxQty: '500' }])[0].maxQty).toBe(99);
  });
  it('lines without a name are dropped', () => {
    expect(addonsPayload([{ id: 'd', name: '  ', price: '10' }])).toEqual([]);
  });
});
