// ✅ استخدام import.meta.env بدلاً من process.env
export const baseURL = import.meta.env.VITE_API_URL;
export const storeURL = import.meta.env.VITE_STORE_URL;
// خدمة المواقع (الدول ← الولايات ← البلديات)
export const locationsURL = import.meta.env.VITE_LOCATIONS_URL || 'http://localhost:7100';
export const MAX_PRODUCT_IMAGES = Number(import.meta.env.VITE_MAX_PRODUCT_IMAGES) || 1;