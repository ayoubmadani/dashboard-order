import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Loader2, Lock } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// طلب مخفي (حصة الخطة): كشفه بدفع ثمنه من المحفظة — بعد تأكيد التاجر
export default function HiddenOrderNotice({ orderId, fee, onRevealed }) {
  const { t } = useTranslation('translation', { keyPrefix: 'settings.quota' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const reveal = async () => {
    if (!window.confirm(t('confirm_reveal', { count: 1, amount: Number(fee || 0), balance: '…' }))) return;
    setBusy(true); setErr('');
    try {
      await axios.post(`${baseURL}/subscription/my/order-quota/reveal/${orderId}`, {}, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      onRevealed?.();
    } catch (e) { setErr(e.response?.data?.message || t('error')); setBusy(false); }
  };
  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/5 p-5 flex flex-wrap items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0"><Lock size={18} /></span>
      <div className="flex-1 min-w-[12rem]">
        <p className="font-bold text-sm text-gray-900 dark:text-white">{t('customer_hidden')}</p>
        <p className="text-xs text-rose-600">{t('customer_hidden_hint')}</p>
        {err && <p className="text-xs font-semibold text-rose-700 mt-1">{err}</p>}
      </div>
      <button type="button" onClick={reveal} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">
        {busy && <Loader2 size={14} className="animate-spin" />}{t('reveal', { amount: Number(fee || 0) })}
      </button>
    </div>
  );
}
