// شحن المحفظة بـ USDT: التاجر يحوّل من حسابه في Binance إلى العنوان، ثم يُدخل رقم التحويل فقط.
// المبلغ = ما وصل فعلاً × سعر الأدمن.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Copy, Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const NETWORK_LABEL = { TRX: 'TRC20 (Tron)', BSC: 'BEP20 (BNB Smart Chain)' };

function CopyField({ label, value }) {
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
        <span dir="ltr" className="flex-1 min-w-0 break-all text-sm font-mono text-gray-900 dark:text-white">{value}</span>
        <button type="button" onClick={copy} className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function BinanceTopUp({ config, onPaid }) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet.binance' });
  const networks = Object.keys(config.addresses || {});
  const [network, setNetwork] = useState(networks[0]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const claim = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${baseURL}/payment/binance/claim`,
        { txId: code.trim() },
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
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-zinc-400">1 USDT = {config.rate} DA</p>

      {networks.length > 1 && (
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
      )}

      <CopyField label={t('address', { network: NETWORK_LABEL[network] })} value={config.addresses[network]} />

      <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t('warning', { network: NETWORK_LABEL[network] })}</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">{t('txid')}</label>
        <input
          dir="ltr"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null); }}
          placeholder={t('txid_placeholder')}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white outline-none focus:border-indigo-400"
        />
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <button
        onClick={claim}
        disabled={loading || !code.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {t('confirm')}
      </button>
      <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500">{t('hint')}</p>
    </div>
  );
}
