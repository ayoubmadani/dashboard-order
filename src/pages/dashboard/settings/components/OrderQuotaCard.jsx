import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';

// حصة طلبات الخطة هذا الشهر: المؤكدة / المشمولة، وسعر الطلب الزائد، والدين إن وُجد
export default function OrderQuotaCard() {
  const { t } = useTranslation('translation', { keyPrefix: 'settings.quota' });
  const [u, setU] = useState(null);
  useEffect(() => {
    axios.get(`${baseURL}/subscription/my/order-quota`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((r) => setU(r.data)).catch(() => setU(null));
  }, []);
  if (!u) return null;
  const unlimited = u.limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((u.used / Math.max(1, u.limit)) * 100));
  const over = !unlimited && u.used >= u.limit;
  return (
    <div className="p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-950 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0"><ShoppingCart size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white">{t('title')}</p>
          <p className="text-xs text-gray-500">{unlimited ? t('unlimited') : t('used', { used: u.used, limit: u.limit })}</p>
        </div>
      </div>
      {!unlimited && (
        <div className="h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${over ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {!unlimited && u.fee > 0 && <p className={`text-xs ${over ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>{t(over ? 'over' : 'fee', { fee: u.fee })}</p>}
      {u.balance < 0 && (
        <p className="text-xs font-semibold text-rose-600">{u.maxDebt > 0 ? t('debt_max', { debt: -u.balance, max: u.maxDebt }) : t('debt', { debt: -u.balance })}</p>
      )}
    </div>
  );
}
