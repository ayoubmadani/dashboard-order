import { describe, expect, it } from 'vitest';
import { imageSlotClass, MAIN_IMAGE_CLASS } from './imageSlots';

// شبكة صور المنتج (3 أعمدة، 5 من sm، 6 من md): زر الإضافة ثم الرئيسية 2×2 في الأعمدة 2-3،
// وفي السطرين الأولين تمتلئ الخانات عموداً عموداً: تحت زر الإضافة، ثم أعلى/أسفل العمود 4، ثم 5، ثم 6.
// ما بعدها يتبع ترتيب الشبكة العادي من السطر الثالث.
describe('image grid slots', () => {
  it('the main image always sits in columns 2-3 over the first two rows', () => {
    expect(MAIN_IMAGE_CLASS).toBe('col-start-2 row-start-1 col-span-2 row-span-2');
  });

  it('slot 0 is the add button corner, slot 1 is under it', () => {
    expect(imageSlotClass(0)).toBe('col-start-1 row-start-1');
    expect(imageSlotClass(1)).toBe('col-start-1 row-start-2');
  });

  it('then column 4 top/bottom and column 5 top/bottom, from 5 columns up', () => {
    expect([2, 3, 4, 5].map(imageSlotClass)).toEqual([
      'sm:col-start-4 sm:row-start-1',
      'sm:col-start-4 sm:row-start-2',
      'sm:col-start-5 sm:row-start-1',
      'sm:col-start-5 sm:row-start-2',
    ]);
  });

  it('column 6 only exists from 6 columns; later slots flow normally (row 3 on)', () => {
    expect(imageSlotClass(6)).toBe('md:col-start-6 md:row-start-1');
    expect(imageSlotClass(7)).toBe('md:col-start-6 md:row-start-2');
    expect(imageSlotClass(8)).toBe('');
    expect(imageSlotClass(-1)).toBe('');
  });
});
