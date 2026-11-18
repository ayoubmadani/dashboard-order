// عدة حسابات على نفس المتصفح (كما في التطبيق): القائمة في dash_accounts، والحساب الحالي يبقى في كوكي access_token كما كان.
// التبديل = نسخ رمز الحساب المختار إلى الكوكي — باقي لوحة التحكم لا يتغير.

export const MAX_ACCOUNTS = 5;
const KEY = 'dash_accounts';

export function readAccounts() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function writeAccounts(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* وضع خاص */ }
}

/** معرّف المستخدم (sub) من رمز JWT، أو null */
export function tokenUserId(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))?.sub ?? null;
  } catch {
    return null;
  }
}

/** حساب جديد يُضاف في الآخر؛ نفس الحساب يُحدَّث في مكانه (رمز جديد، لم يعد منتهياً، يبقى آخر متجر) */
export function upsertAccount(list, account) {
  const i = list.findIndex((a) => a.id === account.id);
  if (i < 0) return [...list, { storeId: null, ...account, expired: false }];
  return list.map((a, k) => (k === i ? { ...a, ...account, storeId: account.storeId ?? a.storeId, expired: false } : a));
}

export const removeAccount = (list, id) => list.filter((a) => a.id !== id);
export const markExpired = (list, id) => list.map((a) => (a.id === id ? { ...a, expired: true } : a));
export const setAccountStore = (list, id, storeId) => list.map((a) => (a.id === id ? { ...a, storeId } : a));

/** الحساب التالي الذي ما زالت جلسته صالحة (بعد الخروج من الحالي)، أو null */
export const nextAccount = (list, excludeId) => list.find((a) => a.id !== excludeId && !a.expired) ?? null;

export const canAddAccount = (list) => list.length < MAX_ACCOUNTS;
