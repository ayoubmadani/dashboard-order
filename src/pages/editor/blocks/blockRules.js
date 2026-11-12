// أقسام لا تجتمع في صفحة واحدة: «المنتج بثيم المتجر» فيه نموذج طلب الثيم، فلا «نموذج طلب» بجانبه (والعكس)
const EXCLUSIVE = [['themeProduct', 'productForm']];

/** القسم الموجود في الصفحة الذي يمنع إضافة هذا النوع، أو null */
export function blockConflict(type, placedTypes) {
  const placed = new Set(placedTypes);
  for (const [a, b] of EXCLUSIVE) {
    if (type === a && placed.has(b)) return b;
    if (type === b && placed.has(a)) return a;
  }
  return null;
}
