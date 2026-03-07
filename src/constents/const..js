// ✅ استخدام import.meta.env بدلاً من process.env
export const baseURL = import.meta.env.VITE_STORE_URL;
export const storeURL = import.meta.env.VITE_API_URL;