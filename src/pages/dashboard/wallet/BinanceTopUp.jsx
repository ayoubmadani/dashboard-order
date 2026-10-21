// شحن المحفظة بـ USDT عبر Binance Pay إلى UID المنصة: QR ورابط يفتحان الدفع في Binance، ثم رقم المعاملة.
// المبلغ = ما وصل فعلاً × سعر الأدمن.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

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
      {label && <span className="shrink-0 text-[10px] font-bold text-gray-400 dark:text-zinc-500">{label}</span>}
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
  // QR: رابط استلام Binance Pay (يفتح الدفع إلى UID في التطبيق)؛ بدونه نعرض الـ UID للنسخ فقط
  const qrValue = config.payLink || null;

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
      {/* 1. QR يفتح Binance Pay */}
      {qrValue && (
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-white rounded-2xl border border-gray-200">
            <QRCodeSVG value={qrValue} size={168} level="M" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{t('scan')} · 1 USDT = {config.rate} DA</p>
        </div>
      )}

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

      {/* الـ UID للإرسال اليدوي: Pay ← Send ← UID */}
      {config.uid && (
        <div className="space-y-1">
          {!qrValue && <p className="text-xs text-gray-500 dark:text-zinc-400">1 USDT = {config.rate} DA</p>}
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{t('uid_label')}</p>
          <CopyRow label="" value={config.uid} />
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">{t('uid_note')}</p>
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
