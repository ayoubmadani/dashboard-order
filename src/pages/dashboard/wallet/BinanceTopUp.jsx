// شحن المحفظة بـ USDT عبر Binance Pay إلى UID المنصة: QR ورابط يفتحان الدفع في Binance، ثم رقم المعاملة.
// المبلغ = ما وصل فعلاً × سعر الأدمن.
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* المتصفح منع النسخ — القيمة ظاهرة للنسخ اليدوي */ }
  };
  return (
    <button type="button" onClick={copy} className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

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

export default function BinanceTopUp({ config, onPaid, via = 'pay' }) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet.binance' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // حاسبة: كم يريد بالدينار ← كم يرسل بالدولار (USDT)، مقرّب للأعلى لسنت
  const [dzd, setDzd] = useState('');
  const usdt = Number(dzd) > 0 ? Math.ceil((Number(dzd) / config.rate) * 100) / 100 : null;
  // via يأتي من تبويبات النافذة: Binance Pay (UID) أو عنوان BEP20 على شبكة BSC
  const bsc = config.addresses?.BSC || null;
  // QR: رابط استلام Binance Pay، أو عنوان BSC في تبويبه
  const qrValue = via === 'bsc' ? bsc : config.payLink || null;

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

  // نفس أسلوب وضع البطاقة: عناوين صغيرة، حقول بنفس الشكل، وارتفاع قريب منه
  const label = 'text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest';

  return (
    <div className="flex-1 min-h-0 flex flex-col">
    {/* المحتوى — يتمرّر */}
    <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4">
      {/* حاسبة الدينار ← الدولار */}
      <div className="space-y-1.5">
        <label className={`${label} block`}>{t('calc_label')}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            dir="ltr"
            min={0}
            value={dzd}
            onChange={(e) => setDzd(e.target.value)}
            placeholder="1000"
            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-1 min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 transition-all"
          />
          <span className="text-xs font-bold text-gray-400">DA</span>
          <span className="text-gray-300 dark:text-zinc-600">=</span>
          <span dir="ltr" className="shrink-0 min-w-[96px] text-center px-3 py-2.5 rounded-xl bg-[#FCD535]/15 text-[#b8860b] dark:text-[#FCD535] text-sm font-black">
            {usdt != null ? `$${usdt.toFixed(2)}` : '$0.00'}
          </span>
        </div>
      </div>

      {/* QR صغير + السعر والزر والـ UID/العنوان بجانبه */}
      <div className="flex items-stretch gap-3">
        {qrValue && (
          <div className="shrink-0 p-2 bg-white rounded-xl border border-gray-100 dark:border-zinc-800 self-center">
            <QRCodeSVG value={qrValue} size={128} level="M" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <p className={label}><span dir="ltr">1 USDT = {config.rate} DA</span></p>
          {/* تفاصيل الطريقة — نفس المكان في التبويبين */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-800 text-xs">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-400 dark:text-zinc-500">{via === 'bsc' ? t('bsc_network') : t('pay_method')}</span>
              <span dir="ltr" className="font-bold text-gray-900 dark:text-white">{via === 'bsc' ? 'BNB Smart Chain (BEP20)' : 'Binance Pay (UID)'}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-400 dark:text-zinc-500">{t('bsc_coin')}</span>
              <span dir="ltr" className="font-bold text-gray-900 dark:text-white">USDT</span>
            </div>
            {via === 'pay' && config.uid && (
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-gray-400 dark:text-zinc-500">UID</span>
                <span className="flex items-center gap-1">
                  <span dir="ltr" className="font-mono font-bold text-gray-900 dark:text-white">{config.uid}</span>
                  <CopyButton value={config.uid} />
                </span>
              </div>
            )}
          </div>
          {via === 'bsc' && <CopyRow label="BEP20" value={bsc} />}
        </div>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed -mt-1">{via === 'bsc' ? t('bsc_note') : t('scan_or_uid')}</p>

    </div>

    {/* رقم المعاملة وزر التأكيد — ثابتان في الأسفل */}
    <div className="shrink-0 px-6 pt-4 pb-6 space-y-3">
      {/* زر يفتح الدفع في Binance */}
      {via === 'pay' && config.payLink && (
        <a
          href={config.payLink}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FCD535] text-gray-900 text-sm font-black hover:brightness-95"
        >
          <ExternalLink className="w-4 h-4" />
          {t('open_binance')}
        </a>
      )}
      {/* رقم المعاملة */}
      <div className="space-y-1.5">
        <label className={`${label} block`}>{t('txid')}</label>
        <input
          dir="ltr"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(null); }}
          placeholder={via === 'bsc' ? t('txid_placeholder_bsc') : t('txid_placeholder')}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 transition-all"
        />
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}
      <button
        onClick={claim}
        disabled={loading || !code.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {t('confirm')}
      </button>

      <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500">{via === 'bsc' ? t('hint_bsc') : t('hint')}</p>
    </div>
    </div>
  );
}
