import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Wallet,
  Plus,
  ArrowUpCircle,
  RefreshCcw,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingBag,
  CreditCard,
  X,
} from 'lucide-react';
import { getAccessToken } from '../../../services/access-token';
import { baseURL } from '../../../constents/const.';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

function fmt(num) {
  return Number(num || 0).toLocaleString('ar-DZ');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-DZ', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl ${className}`} />
);

// ─────────────────────────────────────────────
//  Top-Up Modal
// ─────────────────────────────────────────────
function TopUpModal({ isRtl, onClose, onConfirm, loading, error, amount, setAmount, clearError }) {
  const { t } = useTranslation('wallet');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 w-full max-w-sm p-6 space-y-5 shadow-2xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 dark:text-white">{t('modal.title')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
            {t('modal.preset_label')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                onClick={() => { setAmount(String(preset)); clearError(); }}
                className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${amount === String(preset)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'
                  }`}
              >
                {preset.toLocaleString('ar-DZ')}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block">
            {t('modal.custom_label')}
          </label>
          <input
            type="number"
            dir="ltr"
            min={100}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); clearError(); }}
            placeholder={t('modal.custom_placeholder')}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-500">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Confirm */}
        <button
          onClick={onConfirm}
          disabled={loading || !amount}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />}
          {t('modal.confirm')}
        </button>

        <p className="text-center text-[11px] text-gray-400 dark:text-zinc-500">
          {t('modal.powered_by')}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function WalletPage() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'wallet' });

  const isRtl = i18n.dir() === 'rtl';
  const headers = useAuthHeaders();

  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState(null);

  /* ── Fetch ── */
  const fetchWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${baseURL}/payment/balance`, headers);
      console.log({data : res.data});
      
      setWalletData(res.data);
    } catch {
      setError(t('error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  /* ── Top-up ── */
  const handleTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount < 100) { setTopUpError(t('error.min_amount')); return; }
    setTopUpLoading(true);
    setTopUpError(null);
    try {
      const res = await axios.post(`${baseURL}/payment/top-up`, { amount }, headers);
      const { checkoutUrl } = res.data;
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch {
      setTopUpError(t('error.top_up'));
    } finally {
      setTopUpLoading(false);
    }
  };

  const closeModal = () => { setShowTopUp(false); setTopUpError(null); setTopUpAmount(''); };

  /* ── Derived values ── */
  const balance = walletData?.balance ?? 0;
  const transactions = (walletData?.user?.transactions ?? [])
    .slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(transactions);
    

  const totalTopUp = transactions.filter(tx => tx.action === 'topUp').reduce((s, tx) => s + Number(tx.amount), 0);
  const totalSpent = transactions.filter(tx => tx.action === 'buy').reduce((s, tx) => s + Number(tx.amount), 0);

  const txIcon = (action) => action === 'buy' ? ShoppingBag : ArrowUpCircle;
  const txColor = (action) => action === 'buy'
    ? { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500' }
    : { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500' };

  // ── Render ──────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50/40 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-900 dark:bg-white rounded-xl">
              <Wallet className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={fetchWallet}
            disabled={loading}
            className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100 dark:border-rose-800/30">
            <XCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Balance card ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 relative overflow-hidden shadow-sm">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-50 dark:bg-indigo-900/10 opacity-60 pointer-events-none blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-emerald-50 dark:bg-emerald-900/10 opacity-40 pointer-events-none blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                {t('balance')}
              </p>
              {loading ? (
                <Skeleton className="h-10 w-44" />
              ) : (
                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight" dir="ltr">
                  {fmt(balance)}
                  <span className="text-lg font-semibold text-gray-400 dark:text-zinc-500 ms-2">{t('currency')}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('top_up_btn')}
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest truncate">{t('total_top_up')}</p>
              {loading ? <Skeleton className="h-5 w-24 mt-1" /> : (
                <p className="font-black text-gray-900 dark:text-white text-sm tabular-nums" dir="ltr">
                  +{fmt(totalTopUp)} {t('currency')}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest truncate">{t('total_spent')}</p>
              {loading ? <Skeleton className="h-5 w-24 mt-1" /> : (
                <p className="font-black text-gray-900 dark:text-white text-sm tabular-nums" dir="ltr">
                  -{fmt(totalSpent)} {t('currency')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Transactions ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">

          {/* Section header */}
          <div className="px-5 py-4 border-b border-gray-50 dark:border-zinc-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <h2 className="font-black text-gray-900 dark:text-white text-sm">{t('transactions')}</h2>
            {!loading && (
              <span className="ms-auto text-[10px] font-bold text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                {transactions.length}
              </span>
            )}
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-3">
                  <Skeleton className="w-9 h-9 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>

          ) : transactions.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400 dark:text-zinc-500">
              <CreditCard className="w-10 h-10 opacity-30" />
              <p className="text-sm">{t('no_transactions')}</p>
            </div>

          ) : (
            <div className="divide-y divide-gray-50 dark:divide-zinc-800/60">
              {transactions.map((tx) => {
                const Icon = txIcon(tx.action);
                const colors = txColor(tx.action);
                const typeLbl = tx.type !== 'wallet' ? t(`type.${tx.type}`, tx.type) : null;

                // التعديل هنا: نتحقق إذا كان الأكشن هو شحن رصيد (TOP_UP)
                // افترضنا أن TransactionAction.TOP_UP ترسل من السيرفر كـ 'top_up'
                const isCredit = tx.action === 'deposit';

                return (
                  <div key={tx.id} className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {/* ترجمة الأكشن: top_up -> شحن، withdraw -> دفع/خصم */}
                        {t(`action.${tx.action}`, tx.action)}
                        {typeLbl && (
                          <span className="ms-1.5 text-xs text-gray-400 dark:text-zinc-500 font-normal">
                            · {typeLbl}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5" dir="ltr">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>

                    {/* Amount */}
                    <span
                      className={`text-sm font-black tabular-nums ${isCredit ? 'text-emerald-500' : 'text-rose-500'}`}
                      dir="ltr"
                    >
                      {/* إذا كان شحن يظهر + باللون الأخضر، وإذا كان خصم يظهر - باللون الأحمر */}
                      {isCredit ? '+' : '-'}{fmt(tx.amount)} {t('currency')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Top-Up Modal ── */}
      {showTopUp && (
        <TopUpModal
          isRtl={isRtl}
          onClose={closeModal}
          onConfirm={handleTopUp}
          loading={topUpLoading}
          error={topUpError}
          amount={topUpAmount}
          setAmount={setTopUpAmount}
          clearError={() => setTopUpError(null)}
        />
      )}
    </div>
  );
}