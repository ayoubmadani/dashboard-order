import { describe, expect, it } from 'vitest';
import { stockPatch } from './stockField';

// تعديل المنتج: المخزون يُرسل فقط إن غيّره التاجر — وإلا يرفض الخادم المخزون السالب (بيع فوق المتوفر)
// ويعيد الحفظ رقماً قديماً فوق ما أنقصته الطلبات المؤكدة أثناء فتح الصفحة
describe('stockPatch', () => {
  it('unchanged stock is not sent (even when negative)', () => {
    expect(stockPatch('-2', -2)).toEqual({});
    expect(stockPatch('5', 5)).toEqual({});
    expect(stockPatch('', 0)).toEqual({});
  });
  it('a stock the merchant changed is sent as a number', () => {
    expect(stockPatch('10', -2)).toEqual({ stock: 10 });
    expect(stockPatch('0', 3)).toEqual({ stock: 0 });
  });
});
