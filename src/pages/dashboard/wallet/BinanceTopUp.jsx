// شحن المحفظة بـ USDT عبر Binance: QR ورابط يفتحان صفحة الدفع في Binance، ثم رقم المعاملة.
// المبلغ = ما وصل فعلاً × سعر الأدمن. UID والعناوين في «طرق أخرى».
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, CheckCircle2, ExternalLink, ChevronDown } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const NETWORK_LABEL = { TRX: 'TRC20 (Tron)', BSC: 'BEP20 (BNB Smart Chain)' };

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* المتصفح منع النسخ — القيمة ظاهرة للنسخ اليدوي */ }
  };
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl">
      <span className="shrink-0 text-[10px] font-bold text-gray-400 dark:text-zinc-500">{label}</span>
      <span dir="ltr" className="flex-1 min-w-0 truncate text-xs font-mono text-gray-900 dark:text-white">{value}</span>
      <button type="button" onClick={copy} className="shrink-0 p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function BinanceTopUp({ config, onPaid }) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet.binance' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOther, setShowOther] = useState(!config.payLink);

  // QR: رابط Binance Pay إن وُجد، وإلا أول عنوان إيداع
  const firstNetwork = Object.keys(config.addresses || {})[0];
  const qrValue = config.payLink || (firstNetwork ? config.addresses[firstNetwork] : config.uid);

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
      {/* 1. QR */}
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-white rounded-2xl border border-gray-200">
          <QRCodeSVG value={qrValue} size={168} level="M" />
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          {config.payLink ? t('scan') : t('scan_address', { network: NETWORK_LABEL[firstNetwork] || 'UID' })} · 1 USDT = {config.rate} DA
        </p>
      </div>

      {/* 2. رابط يفتح الدفع في Binance */}
      {config.payLink && (
        <a
          href={config.payLink}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FCD535] text-gray-900 font-black hover:brightness-95"
        >
          <ExternalLink className="w-4 h-4" />
          {t('open_binance')}
        </a>
      )}

      {/* طرق أخرى: UID والعناوين */}
      {(config.uid || firstNetwork) && (
        <div>
          {config.payLink && (
            <button
              type="button"
              onClick={() => setShowOther((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-zinc-500 hover:text-gray-600"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOther ? 'rotate-180' : ''}`} />
              {t('other_ways')}
            </button>
          )}
          {showOther && (
            <div className="mt-2 space-y-1.5">
              {config.uid && <CopyRow label="UID" value={config.uid} />}
              {Object.entries(config.addresses || {}).map(([n, addr]) => (
                <CopyRow key={n} label={NETWORK_LABEL[n]} value={addr} />
              ))}
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">{t('other_note')}</p>
            </div>
          )}
        </div>
      )}

      {/* 3. رقم المعاملة */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">{t('txid')}</label>
        <input
          dir="ltr"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null); }}
          placeholder={t('txid_placeholder')}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white outline-none focus:border-indigo-400"
        />
        <p className="text-[11px] text-gray-400 dark:text-zinc-500">{t('hint')}</p>
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
    </div>
  );
}
