// الخطوة الثانية لشحن المحفظة بـ USDT: العنوان والمبلغ الفريد بالضبط، ثم رقم المعاملة (TxID)
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { X, Copy, Check, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const NETWORK_LABEL = { TRX: 'TRC20 (Tron)', BSC: 'BEP20 (BNB Smart Chain)' };

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* المتصفح منع النسخ — القيمة ظاهرة للنسخ اليدوي */ }
  };
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl">
        <span dir="ltr" className={`flex-1 min-w-0 break-all text-sm text-gray-900 dark:text-white ${mono ? 'font-mono' : 'font-bold'}`}>{value}</span>
        <button type="button" onClick={copy} className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function BinanceTopUp({ request, isRtl, onClose, onPaid }) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet.binance' });
  const networks = Object.keys(request.addresses);
  const [network, setNetwork] = useState(networks[0]);
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, new Date(request.expiresAt).getTime() - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');

  const confirm = async () => {
    if (!txId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${baseURL}/payment/binance/confirm`,
        { requestId: request.id, txId: txId.trim() },
        { headers: { Authorization: `Bearer ${getAccessToken()}` } },
      );
      onPaid(res.data.amountDzd);
    } catch (e) {
      setError(e.response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 w-full max-w-md max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 dark:text-white">{t('title')}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-zinc-400">
            {Number(request.amountDzd).toLocaleString('ar-DZ')} DA · 1 USDT = {request.rate} DA
          </span>
          <span className={`flex items-center gap-1 font-bold tabular-nums ${left ? 'text-gray-700 dark:text-zinc-200' : 'text-rose-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            {mm}:{ss}
          </span>
        </div>

        {/* الشبكة */}
        <div className="grid grid-cols-2 gap-2">
          {networks.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNetwork(n)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                network === n ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'
              }`}
            >
              {NETWORK_LABEL[n]}
            </button>
          ))}
        </div>

        <CopyField label={t('amount')} value={`${request.amountUsdt}`} mono={false} />
        <CopyField label={t('address', { network: NETWORK_LABEL[network] })} value={request.addresses[network]} />

        <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('warning', { amount: request.amountUsdt, network: NETWORK_LABEL[network] })}</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">{t('txid')}</label>
          <input
            dir="ltr"
            value={txId}
            onChange={(e) => { setTxId(e.target.value); setError(null); }}
            placeholder={t('txid_placeholder')}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white outline-none focus:border-indigo-400"
          />
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <button
          onClick={confirm}
          disabled={loading || !txId.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {t('confirm')}
        </button>
        <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500">{t('hint')}</p>
      </div>
    </div>
  );
}
