import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from './access-token';

// كاش بسيط داخل الجلسة (يشبه subCache في الباك-إند) — يمنع كل صفحة
// (Create/Edit المنتج، ولاحقاً أي صفحة أخرى تحتاج حدود الخطة) من إعادة
// طلب /subscription/my في كل mount؛ ينتهي صلاحيته تلقائياً بعد 5 دقائق
// أو عند تسجيل الدخول بحساب مختلف (clearPlanCache من authService عند logout)
let cache = null;
let cacheTs = 0;
let pending = null;
const TTL = 5 * 60 * 1000;

export async function getMyPlanFeatures() {
  const now = Date.now();
  if (cache && now - cacheTs < TTL) return cache;
  if (pending) return pending;

  const token = getAccessToken();
  if (!token) return null;

  pending = axios
    .get(`${baseURL}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } })
    .then(({ data }) => {
      cache = data?.plan?.features ?? null;
      cacheTs = Date.now();
      return cache;
    })
    .catch(() => cache) // نُبقي القيمة القديمة إن وُجدت بدل تفريغها بسبب خطأ مؤقت
    .finally(() => { pending = null; });

  return pending;
}

export function clearPlanCache() {
  cache = null;
  cacheTs = 0;
}
