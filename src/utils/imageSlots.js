// شبكة صور المنتج (3 أعمدة، 5 من sm، 6 من md) — الأصناف مكتوبة كاملة حتى يلتقطها Tailwind.
// الرئيسية 2×2 في العمودين 2-3. في السطرين الأولين تمتلئ الخانات عموداً عموداً:
// الخانة 0 = زاوية زر الإضافة، 1 = تحته، ثم أعلى/أسفل العمود 4، ثم 5، ثم 6.
// ما بعد ذلك بلا موضع محدد فيتبع ترتيب الشبكة من السطر الثالث.
export const MAIN_IMAGE_CLASS = 'col-start-2 row-start-1 col-span-2 row-span-2';

const SLOTS = [
  'col-start-1 row-start-1',
  'col-start-1 row-start-2',
  'sm:col-start-4 sm:row-start-1',
  'sm:col-start-4 sm:row-start-2',
  'sm:col-start-5 sm:row-start-1',
  'sm:col-start-5 sm:row-start-2',
  'md:col-start-6 md:row-start-1',
  'md:col-start-6 md:row-start-2',
];

export function imageSlotClass(slot) {
  return SLOTS[slot] ?? '';
}
