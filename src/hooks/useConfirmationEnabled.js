import { useEffect, useState } from 'react';
import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';

// شركات التأكيد في مرحلة تجريبية: الـ API يقرر لكل تاجر (أدمن / حساب تجريبي / مفتوحة للجميع).
// طلب واحد لكل تحميل للصفحة، تتشاركه كل المكوّنات.
let cached = null; // Promise<boolean>

export function confirmationEnabled() {
  if (!cached) {
    cached = axios
      .get(`${baseURL}/confirmation/me`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => data?.merchantEnabled === true)
      .catch(() => {
        cached = null; // فشل مؤقت: نعيد المحاولة في المرة القادمة
        return false;
      });
  }
  return cached;
}

/** null = لم يُعرف بعد، true/false = الجواب */
export default function useConfirmationEnabled() {
  const [enabled, setEnabled] = useState(null);
  useEffect(() => {
    let alive = true;
    confirmationEnabled().then((v) => { if (alive) setEnabled(v); });
    return () => { alive = false; };
  }, []);
  return enabled;
}
