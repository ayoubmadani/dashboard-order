import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Loader2, Lock, ShoppingCart } from 'lucide-react';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const URL_Q = () => `${baseURL}/subscription/my/order-quota`;

/**
 * حصة طلبات الخطة: العدّاد، الدين، والطلبات المخفية — الدفع بموافقة التاجر فقط (زر + تأكيد).
 * compact: شريط صغير لصفحة الطلبات (يظهر فقط إن وُجد دين أو مخفي)
 */
// reloadKey: يتغير ← يُعاد التحميل (زر التحديث في صفحة الطلبات)
export default function OrderQuotaCard({ compact = false, onChanged, reloadKey = 0 }) {
  const { t } = useTranslation('translation', { keyPrefix: 'settings.quota' });
  const [u, setU] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    axios.get(URL_Q(), auth()).then((r) => setU(r.data)).catch(() => setU(null));
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);

  const act = async (key, path, body, confirmText) => {
    if (!window.confirm(confirmText)) return;
    setBusy(key); setErr('');
    try { await axios.post(`${URL_Q()}/${path}`, body ?? {}, auth()); load(); onChanged?.(); }
    catch (e) { setErr(e.response?.data?.message || t('error')); }
    finally { setBusy(null); }
  };

  if (!u) return null;
  const unlimited = u.limit < 0;
  const hidden = (u.hidden?.current || 0) + (u.hidden?.old || 0);
  if (compact && !u.debt && !hidden) return null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((u.used / Math.max(1, u.limit)) * 100));
  const btn = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50';

  return (
    <div className={`${compact ? 'p-4' : 'p-5'} rounded-2xl border ${hidden ? 'border-rose-200 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/5' : 'border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-950'} space-y-3`}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0">{hidden ? <Lock size={18} /> : <ShoppingCart size={18} />}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white">{t('title')}</p>
          <p className="text-xs text-gray-500">{unlimited ? t('unlimited') : t('used', { used: u.used, limit: u.limit })}{!unlimited && u.fee > 0 ? ` — ${t('fee', { fee: u.fee })}` : ''}</p>
        </div>
      </div>
      {!unlimited && !compact && (
        <div className="h-2 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>
      )}

      {u.debt > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 min-w-[12rem] text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t(u.oldDebt ? 'debt_old' : 'debt', { debt: u.debt, max: u.maxDebt })}
          </p>
          <button type="button" disabled={!!busy} onClick={() => act('debt', 'pay-debt', null, t('confirm_debt', { amount: u.debt, balance: u.balance }))}
            className={`${btn} bg-amber-500 text-white`}>{busy === 'debt' && <Loader2 size={12} className="animate-spin" />}{t('pay_debt', { amount: u.debt })}</button>
        </div>
      )}

      {u.hidden?.current > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 min-w-[12rem] text-xs font-semibold text-rose-600">{t('hidden_current', { count: u.hidden.current })}</p>
          <button type="button" disabled={!!busy} onClick={() => act('cur', 'reveal', { scope: 'current' }, t('confirm_reveal', { count: u.hidden.current, amount: u.hidden.currentCost, balance: u.balance }))}
            className={`${btn} bg-rose-600 text-white`}>{busy === 'cur' && <Loader2 size={12} className="animate-spin" />}{t('reveal', { amount: u.hidden.currentCost })}</button>
        </div>
      )}
      {u.hidden?.old > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 min-w-[12rem] text-xs font-semibold text-gray-600 dark:text-zinc-300">{t('hidden_old', { count: u.hidden.old })}</p>
          <button type="button" disabled={!!busy} onClick={() => act('old', 'reveal', { scope: 'old' }, t('confirm_reveal', { count: u.hidden.old, amount: u.hidden.oldCost, balance: u.balance }))}
            className={`${btn} border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200`}>{busy === 'old' && <Loader2 size={12} className="animate-spin" />}{t('reveal', { amount: u.hidden.oldCost })}</button>
        </div>
      )}
      {hidden > 0 && <p className="text-[11px] text-gray-500">{t('balance', { balance: u.balance })}</p>}
      {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
    </div>
  );
}
