// خصائص المنتج — نفس طريقة تطبيق الهاتف: خاصية واحدة (اسم أولاً) بثلاث طرق عرض: نص | لون | صورة
// الأسطر الفارغة تبقى أثناء التعديل وتُحذف عند الحفظ

let seq = 0;
const uid = (p) => `${p}-${Date.now()}-${++seq}`;

/** خاصية جديدة: تُفتح على النص (يمكن تحويلها لون أو صورة) */
export const newAttribute = (name) => ({ id: uid('att'), type: 'color', name, displayMode: 'text', variants: [] });

/** طريقة العرض الحالية (الخصائص القديمة من نوع نص/مقاس = نص) */
export const modeOf = (attr) => (attr.type === 'color' ? attr.displayMode || 'color' : 'text');

/** تغيير الطريقة يمسح القيم (لون ≠ نص ≠ صورة) */
export const setMode = (attr, mode) => (modeOf(attr) === mode ? attr : { ...attr, displayMode: mode, variants: [] });

const mapValue = (attr, id, fn) => ({ ...attr, variants: attr.variants.map((v) => (v.id === id ? fn(v) : v)) });
const customName = (v) => (v.name && v.name !== v.value ? v.name : '');

/** سطر جديد في آخر القائمة (فارغ للنص/الصورة، رمز للون) */
export const addValue = (attr, value = '') => ({ ...attr, variants: [...attr.variants, { id: uid('var'), name: value, value }] });

export const editText = (attr, id, text) => mapValue(attr, id, (v) => ({ ...v, value: text, name: text }));

/** لون: الاسم الذي كتبه التاجر (أحمر) يبقى عند تغيير الرمز */
export const setColor = (attr, id, hex) => mapValue(attr, id, (v) => ({ ...v, value: hex, name: customName(v) || hex }));

export const setImage = (attr, id, url, imageId) => mapValue(attr, id, (v) => ({ ...v, value: url, name: customName(v) || url, imageId }));

/** اسم القيمة (اسم اللون/الصورة): فارغ ← يعود إلى الرمز */
export const setValueName = (attr, id, name) => mapValue(attr, id, (v) => ({ ...v, name: String(name ?? '').trim() ? name : v.value }));

/** صورة من صور المنتج تظهر للزبون عند اختيار هذه القيمة */
export const linkImage = (attr, id, url) => mapValue(attr, id, (v) => ({ ...v, imageUrl: url || null }));

export const removeValue = (attr, id) => ({ ...attr, variants: attr.variants.filter((v) => v.id !== id) });

const filled = (v) => String(v.value ?? '').trim() !== '';

/** للحفظ: بلا الأسطر الفارغة */
export const cleanAttributes = (attributes) => attributes.map((a) => ({ ...a, variants: a.variants.filter(filled) }));

/** أخطاء الخصائص بنفس مفاتيح الصفحة: attr_<id>, attr_empty_<id>, variant_<id> */
export function attributeErrors(attributes, t) {
  const e = {};
  const key = (n) => String(n ?? '').trim().toLowerCase();
  const counts = {};
  attributes.forEach((a) => { if (key(a.name)) counts[key(a.name)] = (counts[key(a.name)] || 0) + 1; });
  attributes.forEach((a) => {
    if (!key(a.name)) e[`attr_${a.id}`] = t('attributes.name_required');
    else if (counts[key(a.name)] > 1) e[`attr_${a.id}`] = t('attributes.name_duplicate');
    if (!a.variants.some(filled)) e[`attr_empty_${a.id}`] = t('attributes.one_variant_required');
    const seen = new Set();
    a.variants.filter(filled).forEach((v) => {
      const k = String(v.value).trim().toLowerCase();
      if (seen.has(k)) e[`variant_${v.id}`] = t('attributes.duplicate_value');
      seen.add(k);
    });
  });
  return e;
}
