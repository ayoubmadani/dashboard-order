import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  FlaskConical, Plus, Loader2, Copy, ExternalLink, Trophy, Pause, Play, Trash2, X, ArrowLeft, ArrowRight, Crown, Eye, Package, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { baseURL } from '../../constents/const.';
import { getAccessToken } from '../../services/access-token';
import NoStoreState from '../../components/NoStoreState';
import ProductPicker from './components/ProductPicker';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const errMsg = (err, fallback) => {
  const m = err?.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

// اختبارات A/B: رابط واحد يوزّع الزوار على 2–3 صفحات هبوط، مع زيارات وطلبات وتحويل كل صفحة
export default function SplitTests() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'abtest' });
  const isRtl = i18n.dir() === 'rtl';
  const storeId = localStorage.getItem('storeId');

  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({});
  const [pages, setPages] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(null);

  const loadStats = useCallback(async (list) => {
    const entries = await Promise.all(list.map((tst) =>
      axios.get(`${baseURL}/split-tests/${tst.id}/stats`, auth()).then((r) => [tst.id, r.data]).catch(() => [tst.id, null])));
    setStats(Object.fromEntries(entries));
  }, []);

  const load = useCallback(async () => {
    if (!storeId) return;
    try {
      const { data } = await axios.get(`${baseURL}/split-tests`, { ...auth(), params: { storeId } });
      setTests(data);
      await loadStats(data);
    } catch (err) {
      toast.error(errMsg(err, t('error')));
    } finally {
      setLoading(false);
    }
  }, [storeId, loadStats, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!storeId) return;
    axios.get(`${baseURL}/builder-pages/store/${storeId}`, auth())
      .then((r) => setPages((Array.isArray(r.data) ? r.data : r.data?.data || []).filter((p) => p.publishedUrl)))
      .catch(() => {});
    axios.get(`${baseURL}/domain/store/${storeId}`, auth())
      .then((r) => setDomains((Array.isArray(r.data) ? r.data : r.data?.data || []).filter((d) => d.scope === 'landing_page' && !d.splitTestId)))
      .catch(() => {});
  }, [storeId]);

  const act = async (id, fn, success) => {
    setBusy(id);
    try { await fn(); if (success) toast.success(success); await load(); }
    catch (err) { toast.error(errMsg(err, t('error'))); }
    finally { setBusy(null); }
  };

  const pickWinner = (test, pageId) => {
    if (!window.confirm(t('confirm_winner'))) return;
    act(test.id, () => axios.post(`${baseURL}/split-tests/${test.id}/winner`, { builderPageId: pageId }, auth()));
  };
  const toggle = (test) => act(test.id, () => axios.patch(`${baseURL}/split-tests/${test.id}`, { isActive: !test.isActive }, auth()));
  const remove = (test) => {
    if (!window.confirm(t('confirm_delete'))) return;
    act(test.id, () => axios.delete(`${baseURL}/split-tests/${test.id}`, auth()));
  };
  const copy = (url) => { navigator.clipboard.writeText(url); toast.success(t('copied')); };

  if (!storeId) return <NoStoreState title={t('title')} subtitle="" cta="" isRtl={isRtl} />;

  const Back = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-5xl mx-auto space-y-6 font-sans">
      <Toaster position="top-center" richColors />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link to="/dashboard/landing-pages" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 mb-2">
            <Back size={13} /> {t('back')}
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-2xl"><FlaskConical size={22} /></span>
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:opacity-90 shrink-0">
          <Plus size={17} /> {t('new')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-violet-600" /></div>
      ) : tests.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 p-10 text-center space-y-2">
          <FlaskConical className="mx-auto text-gray-300" size={36} />
          <p className="font-bold text-gray-700 dark:text-zinc-200">{t('empty')}</p>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{t('empty_hint')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} stats={stats[test.id]} busy={busy === test.id} t={t} i18n={i18n}
              onCopy={copy} onWinner={pickWinner} onToggle={toggle} onDelete={remove} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal t={t} storeId={storeId} pages={pages} domains={domains}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); toast.success(t('created')); load(); }} />
      )}
    </div>
  );
}

function TestCard({ test, stats, busy, t, i18n, onCopy, onWinner, onToggle, onDelete }) {
  const rows = stats?.variants ?? test.variants.map((v) => ({ ...v, views: 0, orders: 0, confirmedOrders: 0, revenue: 0, conversionPct: 0, confirmedConversionPct: 0 }));
  const winnerName = rows.find((r) => r.builderPageId === test.winnerPageId)?.name;
  const running = test.isActive && !test.winnerPageId;
  // الأفضل = أعلى تحويل مؤكد، ثم أعلى تحويل
  const best = rows.length && rows.some((r) => r.views > 0)
    ? [...rows].sort((a, b) => b.confirmedConversionPct - a.confirmedConversionPct || b.conversionPct - a.conversionPct)[0].builderPageId
    : null;
  const lowData = running && rows.some((r) => r.views < 100);
  const fmt = (d) => new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, { day: 'numeric', month: 'short' });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-gray-900 dark:text-white">{test.name}</p>
            <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${running ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : test.winnerPageId ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800'}`}>
              {running ? t('running') : test.winnerPageId ? t('finished', { name: winnerName }) : t('paused')}
            </span>
            <span className="text-xs text-gray-400">{t('since', { date: fmt(test.createdAt) })}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <a href={test.url} target="_blank" rel="noreferrer" dir="ltr" className="text-xs font-mono text-violet-600 hover:underline truncate">{test.domain}</a>
            <button onClick={() => onCopy(test.url)} className="p-1 text-gray-400 hover:text-gray-700" title={t('copy')}><Copy size={13} /></button>
            <a href={test.url} target="_blank" rel="noreferrer" className="p-1 text-gray-400 hover:text-gray-700"><ExternalLink size={13} /></a>
            {test.domainActive === false && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded px-1.5 py-0.5">{t('domain_pending')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!test.winnerPageId && (
            <button onClick={() => onToggle(test)} disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-200 disabled:opacity-50">
              {test.isActive ? <Pause size={13} /> : <Play size={13} />} {test.isActive ? t('pause') : t('resume')}
            </button>
          )}
          <button onClick={() => onDelete(test)} disabled={busy} className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-400 hover:text-rose-500 disabled:opacity-50"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className={`grid gap-3 grid-cols-1 ${rows.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {rows.map((r, idx) => {
          const isBest = running && r.builderPageId === best;
          const isWinner = r.builderPageId === test.winnerPageId;
          return (
            <div key={r.builderPageId} className={`rounded-xl border-2 p-4 space-y-3 ${isWinner ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-900/10' : isBest ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-100 dark:border-zinc-800'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                  <a href={`${test.url}/?ab=${idx + 1}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline">
                    <Eye size={11} /> {t('preview')}
                  </a>
                </div>
                {isWinner ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 shrink-0"><Crown size={12} /> {t('winner')}</span>
                ) : isBest ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 shrink-0"><Trophy size={12} /> {t('best')}</span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                {[
                  { label: t('views'), value: r.views.toLocaleString() },
                  { label: t('orders'), value: r.orders.toLocaleString() },
                  { label: t('conversion'), value: `${r.conversionPct}%` },
                  { label: t('confirmed_conversion'), value: `${r.confirmedConversionPct}%` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 py-2">
                    <p className="text-base font-black text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-[10px] font-semibold text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                <span>{t('confirmed')}: <b>{r.confirmedOrders}</b> · {Number(r.revenue).toLocaleString()} DZD</span>
                <span>{t('share')}: {r.sharePct ?? '—'}%</span>
              </div>
              {running && (
                <button onClick={() => onWinner(test, r.builderPageId)} disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50">
                  <Crown size={13} /> {t('pick_winner')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {lowData && <p className="text-xs text-amber-600">{t('low_data')}</p>}
    </div>
  );
}

function CreateModal({ t, storeId, pages, domains, onClose, onCreated }) {
  const [name, setName] = useState('');
  // الخطوة الأولى: المنتج — كل صفحات الاختبار لنفس المنتج
  const [product, setProduct] = useState(null);
  const [pickingProduct, setPickingProduct] = useState(false);
  const [domainMode, setDomainMode] = useState('new');
  const [newDomain, setNewDomain] = useState('');
  const [variants, setVariants] = useState([{ builderPageId: '', weight: 50 }, { builderPageId: '', weight: 50 }]);
  const [domainId, setDomainId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setVariant = (i, patch) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const addThird = () => setVariants([{ ...variants[0], weight: 34 }, { ...variants[1], weight: 33 }, { builderPageId: '', weight: 33 }]);
  const removeThird = () => setVariants([{ ...variants[0], weight: 50 }, { ...variants[1], weight: 50 }]);

  const total = variants.reduce((s, v) => s + Number(v.weight || 0), 0) || 1;
  const productPages = product ? pages.filter((p) => p.productId === product.id) : [];
  const chooseProduct = (p) => {
    setProduct(p);
    setPickingProduct(false);
    setVariants((vs) => vs.map((v) => ({ ...v, builderPageId: '' })));
  };
  const domainOk = domainMode === 'new' ? /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(newDomain.trim()) : !!domainId;
  const valid = name.trim() && product && domainOk && variants.every((v) => v.builderPageId) && new Set(variants.map((v) => v.builderPageId)).size === variants.length;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.post(`${baseURL}/split-tests`, {
        storeId, name: name.trim(),
        variants: variants.map((v) => ({ builderPageId: v.builderPageId, weight: Math.max(1, Math.min(100, Number(v.weight) || 1)) })),
        ...(domainMode === 'new' ? { domain: newDomain.trim().toLowerCase() } : { domainId }),
      }, auth());
      onCreated();
    } catch (err) {
      setError(errMsg(err, t('error')));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500';
  const label = 'block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <form onSubmit={submit} className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2"><FlaskConical size={18} className="text-violet-600" /> {t('new')}</p>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div>
          <label className={label}>{t('name')}</label>
          <input value={name} maxLength={120} placeholder={t('name_ph')} className={input}
            onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className={label}>{t('product')}</label>
          <button type="button" onClick={() => setPickingProduct(true)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-start ${product ? 'bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700' : 'border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-violet-500'}`}>
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0 flex items-center justify-center">
              {product?.imagesProduct?.[0]?.imageUrl ? <img src={product.imagesProduct[0].imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={15} className="text-gray-400" />}
            </div>
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white truncate">{product?.name || t('choose_product')}</span>
            <ChevronDown size={16} className="text-gray-400 shrink-0" />
          </button>
          {product && productPages.length < 2 && (
            <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2 mt-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {t('need_two_pages', { count: productPages.length })}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className={label}>{t('pages')}</label>
          {variants.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={v.builderPageId} onChange={(e) => setVariant(i, { builderPageId: e.target.value })} disabled={!product} className={`${input} min-w-0 disabled:opacity-50`}>
                <option value="">{t('page_n', { n: i + 1 })} — {t('choose_page')}</option>
                {productPages.map((p) => (
                  <option key={p.id} value={p.id} disabled={variants.some((o, j) => j !== i && o.builderPageId === p.id)}>{p.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 shrink-0">
                <input type="number" min={1} max={100} value={v.weight} onChange={(e) => setVariant(i, { weight: e.target.value })}
                  className="w-16 px-2 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-center text-gray-900 dark:text-white" aria-label={t('weight')} />
                <span className="text-xs text-gray-400 w-9">{Math.round((Number(v.weight || 0) / total) * 100)}%</span>
              </div>
              {i === 2 && <button type="button" onClick={removeThird} className="p-1.5 text-gray-400 hover:text-rose-500 shrink-0"><X size={16} /></button>}
            </div>
          ))}
          {variants.length < 3 && (
            <button type="button" onClick={addThird} className="text-xs font-bold text-violet-600 hover:underline">+ {t('add_page')}</button>
          )}
          <p className="text-xs text-gray-400">{t('unpublished_hint')}</p>
        </div>

        <div className="space-y-2">
          <label className={label}>{t('domain_label')}</label>
          <div className="grid grid-cols-2 gap-2">
            {[['new', t('domain_new')], ['existing', t('domain_existing')]].map(([mode, text]) => (
              <button key={mode} type="button" onClick={() => setDomainMode(mode)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition ${domainMode === mode ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
                {text}
              </button>
            ))}
          </div>
          {domainMode === 'new' ? (
            <>
              <input dir="ltr" value={newDomain} onChange={(e) => setNewDomain(e.target.value.replace(/\s+/g, '').toLowerCase())}
                placeholder={t('domain_ph')} className={`${input} font-mono`} />
              <p className="text-xs text-gray-400">{t('domain_hint')}</p>
            </>
          ) : domains.length === 0 ? (
            <p className="text-xs text-gray-400">{t('no_free_domains')}</p>
          ) : (
            <>
              <select value={domainId} onChange={(e) => setDomainId(e.target.value)} className={input}>
                <option value="">{t('domain_existing')}</option>
                {domains.map((d) => <option key={d.id} value={d.id}>{d.domain}</option>)}
              </select>
              <p className="text-xs text-gray-400">{t('domain_existing_hint')}</p>
            </>
          )}
        </div>

        {pickingProduct && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setPickingProduct(false)}>
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-4" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('choose_product')}</p>
                <button type="button" onClick={() => setPickingProduct(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <ProductPicker selectedProductId={product?.id} onSelect={chooseProduct} />
            </div>
          </div>
        )}

        {error && <p className="text-sm font-semibold text-rose-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={!valid || saving}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />} {t('create')}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-600 dark:text-zinc-300">{t('cancel')}</button>
        </div>
      </form>
    </div>
  );
}
