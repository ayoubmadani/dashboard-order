// تحويل قائمة المحرر إلى ما يقبله الـ API (تجاهل الأسطر بلا اسم)
export const addonsPayload = (addons = []) =>
  addons
    .filter((a) => a.name?.trim())
    .map((a) => ({ id: String(a.id), name: a.name.trim(), price: Number(a.price) || 0, isActive: a.isActive !== false, maxQty: Math.min(99, Math.max(1, Math.floor(Number(a.maxQty) || 1))) }));
