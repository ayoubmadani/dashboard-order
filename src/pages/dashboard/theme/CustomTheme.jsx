import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Sparkles, Loader2, Wand2, Clock, CheckCircle2, XCircle, RefreshCw, Plus, Minus, PenLine } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import NoStoreState from '../../../components/NoStoreState';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const errMsg = (err, fallback) => {
  const m = err?.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

const STATUS_STYLE = {
  queued: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  review: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  live: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  failed: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
  rejected: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400',
};

// ثيم خاص بالمتجر تصنعه المنصة بـ Claude: يدفع التاجر من محفظته، ويطلب تعديلات حسب المراجعات المتاحة
export default function CustomTheme() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'theme.custom' });
  const isRtl = i18n.dir() === 'rtl';
  const storeId = localStorage.getItem('storeId');

  const [cfg, setCfg] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState({});
  const [buyCount, setBuyCount] = useState(1);

  const load = useCallback(async () => {
    try {
      const [c, o] = await Promise.all([
        axios.get(`${baseURL}/custom-themes/config`, auth()),
        axios.get(`${baseURL}/custom-themes`, auth()),
      ]);
      setCfg(c.data);
      setOrders(o.data);
    } catch (err) {
      setError(errMsg(err, t('load_error')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const order = useMemo(() => orders.find((o) => o.storeId === storeId) ?? null, [orders, storeId]);
  const activeJob = order?.jobs.find((j) => j.status === 'queued' || j.status === 'review');

  // تحديث تلقائي كل دقيقة ما دام هناك طلب قيد التنفيذ
  useEffect(() => {
    if (!activeJob) return undefined;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [activeJob, load]);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try { await fn(); await load(); }
    catch (err) { setError(errMsg(err, t('action_error'))); }
    finally { setBusy(false); }
  };

  const create = () => run(() => axios.post(`${baseURL}/custom-themes`, { storeId, request: brief.trim() }, auth()).then(() => setBrief('')));
  const revise = () => run(() => axios.post(`${baseURL}/custom-themes/${order.id}/revisions`, { request: (revision[order.id] || '').trim() }, auth())
    .then(() => setRevision((r) => ({ ...r, [order.id]: '' }))));
  const buy = () => run(() => axios.post(`${baseURL}/custom-themes/${order.id}/buy-revisions`, { count: buyCount }, auth()));

  const fmt = (d) => (d ? new Date(d).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const money = (n) => `${Number(n || 0).toLocaleString()} ${t('currency')}`;
  const card = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6';
  const textarea = 'w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white min-h-[110px]';

  if (!storeId) return <NoStoreState title={t('no_store')} subtitle="" cta="" isRtl={isRtl} />;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl"><Sparkles size={22} /></span>
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
      </div>

      {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : !cfg?.enabled && !order ? (
        <div className={`${card} text-center text-sm text-gray-500 dark:text-zinc-400`}>{t('disabled')}</div>
      ) : !order ? (
        /* ── طلب جديد ── */
        <div className={`${card} space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: t('price'), value: money(cfg.price) },
              { label: t('revisions_included'), value: cfg.revisions },
              { label: t('ready_in'), value: t('ready_in_value', { hours: cfg.delayHours }) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-zinc-800 px-4 py-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase">{s.label}</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300">{t('brief_label')}</label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={3000} placeholder={t('brief_placeholder')} className={textarea} />
          <p className="text-xs text-gray-400">{t('brief_hint')}</p>
          <button onClick={create} disabled={busy || brief.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {t('order_btn', { price: money(cfg.price) })}
          </button>
          <p className="text-xs text-gray-400 text-center">{t('wallet_note')}</p>
        </div>
      ) : (
        /* ── طلب موجود ── */
        <>
          <div className={`${card} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{order.isLive ? t('live_title') : t('in_progress_title')}</p>
                <p className="text-xs text-gray-400 font-mono">{order.slug}</p>
              </div>
              <button onClick={load} className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500"><RefreshCw size={15} /></button>
            </div>

            <div className="space-y-3">
              {order.jobs.map((j) => (
                <div key={j.id} className="rounded-xl border border-gray-100 dark:border-zinc-800 p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold rounded-lg px-2 py-1 ${STATUS_STYLE[j.status]}`}>{t(`status.${j.status}`)}</span>
                    <span className="text-xs text-gray-400">{t(`kind.${j.kind}`)} · {fmt(j.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{j.request}</p>
                  {j.status === 'queued' && <p className="flex items-center gap-1.5 text-xs text-indigo-600"><Loader2 size={12} className="animate-spin" /> {t('queued_hint')}</p>}
                  {j.status === 'review' && <p className="flex items-center gap-1.5 text-xs text-amber-700"><Clock size={12} /> {t('review_hint', { time: fmt(j.liveAt) })}</p>}
                  {j.status === 'live' && <p className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 size={12} /> {t('live_hint')}</p>}
                  {(j.status === 'failed' || j.status === 'rejected') && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500"><XCircle size={12} /> {t('refunded_hint')}{j.error ? ` — ${j.error}` : ''}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {order.isLive && (
            <div className={`${card} space-y-4`}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><PenLine size={16} /> {t('revision_title')}</p>
                <span className="text-xs font-bold rounded-lg px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                  {t('revisions_left', { left: order.revisionsLeft, total: order.revisionsTotal })}
                </span>
              </div>

              {order.revisionsLeft > 0 ? (
                <>
                  <textarea value={revision[order.id] || ''} onChange={(e) => setRevision((r) => ({ ...r, [order.id]: e.target.value }))}
                    maxLength={3000} placeholder={t('revision_placeholder')} className={textarea} disabled={!!activeJob} />
                  <button onClick={revise} disabled={busy || !!activeJob || (revision[order.id] || '').trim().length < 5}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} {t('revision_btn')}
                  </button>
                  {activeJob && <p className="text-xs text-gray-400 text-center">{t('wait_active')}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('no_revisions')}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <span className="text-sm text-gray-600 dark:text-zinc-300">{t('buy_label', { price: money(cfg?.revisionPrice) })}</span>
                <div className="inline-flex items-center border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                  <button onClick={() => setBuyCount((c) => Math.max(1, c - 1))} className="p-2"><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold">{buyCount}</span>
                  <button onClick={() => setBuyCount((c) => Math.min(20, c + 1))} className="p-2"><Plus size={14} /></button>
                </div>
                <button onClick={buy} disabled={busy}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl disabled:opacity-50">
                  {t('buy_btn', { total: money((cfg?.revisionPrice || 0) * buyCount) })}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
