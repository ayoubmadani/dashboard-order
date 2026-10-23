// المخزون: الكميات لكل منتج ونسخة، التنبيهات، القيمة، وسجل كل حركة.
// ينقص تلقائياً عند تأكيد الطلب ويعود عند الإلغاء/الإرجاع (الخادم: InventoryService).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Boxes, Search, Plus, ClipboardCheck, ChevronDown, Loader2, Package, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const headers = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const STATUS_CLS = {
  ok: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  low: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  out: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
};

// النسخة كما يراها الزبون: نص يُكتب، صورة مصغّرة، أو دائرة لون (قيمتهما رابط/كود لا اسم)
const toParts = (v) => (Array.isArray(v) ? v.map((a) => ({ mode: a.mode || a.displayMode || 'text', value: String(a.value ?? ''), attr: a.attr || a.attrName || '' })) : []);

function VariantParts({ parts, className = '' }) {
  const list = toParts(parts);
  if (!list.length) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {list.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 dark:text-zinc-600">/</span>}
          {p.mode === 'image' ? (
            <img src={p.value} alt={p.attr} title={p.attr} className="w-5 h-5 rounded-md object-cover border border-gray-200 dark:border-zinc-700" />
          ) : p.mode === 'color' ? (
            <span title={p.attr} className="w-4 h-4 rounded-full border border-gray-200 dark:border-zinc-700" style={{ backgroundColor: p.value }} />
          ) : (
            <span>{p.value}</span>
          )}
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation('translation', { keyPrefix: 'inventory' });
  return <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${STATUS_CLS[status]}`}>{t(`status.${status}`)}</span>;
}

// توريد (+) أو جرد (= الرقم الفعلي) لمنتج أو نسخة
function AdjustModal({ target, storeId, onClose, onSaved }) {
  const { t } = useTranslation('translation', { keyPrefix: 'inventory' });
  const [mode, setMode] = useState(target.mode);
  const [quantity, setQuantity] = useState(target.mode === 'set' ? String(target.stock) : '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${baseURL}/stores/${storeId}/inventory/adjust`, {
        productId: target.productId,
        variantDetailId: target.variantId || null,
        mode,
        quantity: Number(quantity),
        note: note.trim() || undefined,
      }, headers());
      onSaved();
    } catch (e) {
      const msg = e.response?.data?.message;
      setError((Array.isArray(msg) ? msg[0] : msg) || t('error'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-black text-gray-900 dark:text-white truncate">{target.name}</h3>
            <p className="text-xs text-gray-400">{t('col.stock')}: <b dir="ltr">{target.stock}</b></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
          {['add', 'set'].map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setQuantity(m === 'set' ? String(target.stock) : ''); }}
              className={`py-1.5 rounded-lg text-xs font-bold ${mode === m ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              {m === 'add' ? t('restock') : t('count')}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mode === 'add' ? t('mode_add') : t('mode_set')}</label>
          <input type="number" dir="ltr" min={mode === 'set' ? 0 : undefined} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={input} autoFocus />
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('note')} className={input} maxLength={255} />
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <button onClick={save} disabled={saving || quantity === ''}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('save')}
        </button>
      </div>
    </div>
  );
}

// خانة صغيرة تُحفظ عند الخروج منها (حد التنبيه / سعر الشراء)
function InlineNumber({ value, onSave, placeholder }) {
  const [v, setV] = useState(value ?? '');
  return (
    <input type="number" dir="ltr" min={0} value={v} placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (String(v) !== String(value ?? '')) onSave(v === '' ? null : Number(v)); }}
      className="w-20 px-2 py-1 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 focus:border-indigo-400 rounded-lg text-sm text-gray-900 dark:text-white outline-none" />
  );
}

function StockTab({ storeId }) {
  const { t } = useTranslation('translation', { keyPrefix: 'inventory' });
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const [adjust, setAdjust] = useState(null);

  const load = useCallback(() => {
    axios.get(`${baseURL}/stores/${storeId}/inventory`, headers()).then((r) => setData(r.data)).catch(() => setData({ products: [], totals: null }));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  const saveSettings = async (productId, patch) => {
    await axios.patch(`${baseURL}/stores/${storeId}/inventory/products/${productId}`, patch, headers()).catch(() => {});
    load();
  };

  const rows = useMemo(() => (data?.products || []).filter((p) =>
    (filter === 'all' || p.status === filter) && (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()))), [data, filter, q]);

  if (!data) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  const tt = data.totals;

  const card = 'rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4';
  return (
    <div className="space-y-5">
      {tt && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={card}><p className="text-xs text-gray-400">{t('totals.products')}</p><p className="text-xl font-black text-gray-900 dark:text-white">{fmt(tt.products)}</p></div>
          <div className={card}><p className="text-xs text-gray-400">{t('totals.units')}</p><p className="text-xl font-black text-gray-900 dark:text-white">{fmt(tt.units)}</p></div>
          <button type="button" onClick={() => setFilter('low')} className={`${card} text-start`}><p className="text-xs text-amber-500">{t('totals.low')}</p><p className="text-xl font-black text-amber-500">{fmt(tt.low)}</p></button>
          <button type="button" onClick={() => setFilter('out')} className={`${card} text-start`}><p className="text-xs text-rose-500">{t('totals.out')}</p><p className="text-xl font-black text-rose-500">{fmt(tt.out)}</p></button>
          <div className={card}><p className="text-xs text-gray-400">{t('totals.value_sell')}</p><p className="text-xl font-black text-gray-900 dark:text-white" dir="ltr">{fmt(tt.valueSell)} DA</p></div>
          <div className={card}>
            <p className="text-xs text-gray-400">{t('totals.value_cost')}</p>
            <p className="text-xl font-black text-gray-900 dark:text-white" dir="ltr">{tt.valueCost == null ? '—' : `${fmt(tt.valueCost)} DA`}</p>
            {tt.valueCost != null && <p className="text-[11px] text-emerald-500" dir="ltr">{t('totals.profit')}: {fmt(tt.valueSell - tt.valueCost)} DA</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {['all', 'low', 'out'].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${filter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
            {t(`filter.${f}`)}
          </button>
        ))}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')}
            className="w-full ps-9 pe-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-400" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-zinc-800">
              <th className="text-start font-bold px-4 py-3">{t('col.product')}</th>
              <th className="text-start font-bold px-4 py-3">{t('col.stock')}</th>
              <th className="text-start font-bold px-4 py-3">{t('col.status')}</th>
              <th className="text-start font-bold px-4 py-3">{t('col.threshold')}</th>
              <th className="text-start font-bold px-4 py-3">{t('col.cost')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-12">{t('empty')}</td></tr>
            )}
            {rows.map((p) => {
              const hasVariants = p.variants.length > 0;
              const expanded = !!open[p.id];
              return [
                <tr key={p.id} className="border-b border-gray-50 dark:border-zinc-800/60">
                  <td className="px-4 py-3">
                    <button type="button" disabled={!hasVariants} onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} className="flex items-center gap-3 text-start">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[240px]">{p.name}</p>
                        {hasVariants && (
                          <p className="text-[11px] text-gray-400 flex items-center gap-1">
                            {t('variants', { count: p.variants.length })}
                            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                          </p>
                        )}
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-black text-gray-900 dark:text-white" dir="ltr">{fmt(p.stock)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3"><InlineNumber key={`t-${p.id}-${p.lowStockThreshold}`} value={p.lowStockThreshold} onSave={(v) => saveSettings(p.id, { lowStockThreshold: v ?? 0 })} /></td>
                  <td className="px-4 py-3"><InlineNumber key={`c-${p.id}-${p.costPrice}`} value={p.costPrice} placeholder="—" onSave={(v) => saveSettings(p.id, { costPrice: v })} /></td>
                  <td className="px-4 py-3">
                    {!hasVariants && (
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setAdjust({ productId: p.id, name: p.name, stock: p.stock, mode: 'add' })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <Plus className="w-3.5 h-3.5" />{t('restock')}
                        </button>
                        <button type="button" onClick={() => setAdjust({ productId: p.id, name: p.name, stock: p.stock, mode: 'set' })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <ClipboardCheck className="w-3.5 h-3.5" />{t('count')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>,
                ...(expanded ? p.variants.map((v) => (
                  <tr key={v.id} className="bg-gray-50/60 dark:bg-zinc-950/40 border-b border-gray-50 dark:border-zinc-800/60">
                    <td className="px-4 py-2 ps-16 text-gray-600 dark:text-zinc-300"><VariantParts parts={v.parts} /></td>
                    <td className="px-4 py-2 font-bold text-gray-900 dark:text-white" dir="ltr">{fmt(v.stock)}</td>
                    <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => setAdjust({ productId: p.id, variantId: v.id, name: `${p.name} — ${v.label}`, stock: v.stock, mode: 'add' })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <Plus className="w-3.5 h-3.5" />{t('restock')}
                        </button>
                        <button type="button" onClick={() => setAdjust({ productId: p.id, variantId: v.id, name: `${p.name} — ${v.label}`, stock: v.stock, mode: 'set' })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <ClipboardCheck className="w-3.5 h-3.5" />{t('count')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : []),
              ];
            })}
          </tbody>
        </table>
      </div>

      {adjust && <AdjustModal target={adjust} storeId={storeId} onClose={() => setAdjust(null)} onSaved={() => { setAdjust(null); load(); }} />}
    </div>
  );
}

function HistoryTab({ storeId }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'inventory' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${baseURL}/stores/${storeId}/inventory/movements`, { ...headers(), params: { page } })
      .then((r) => setData(r.data)).catch(() => setData({ items: [], total: 0, page: 1, limit: 30 }));
  }, [storeId, page]);

  if (!data) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-zinc-800">
              {['date', 'product', 'change', 'after', 'reason', 'by'].map((k) => <th key={k} className="text-start font-bold px-4 py-3">{t(`h.${k}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-12">{t('history_empty')}</td></tr>}
            {data.items.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 dark:border-zinc-800/60">
                <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language)}</td>
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">{m.productName || '—'}</p>
                  {m.variantName && <VariantParts parts={m.variantName} className="text-[11px] text-gray-400" />}
                </td>
                <td className={`px-4 py-2.5 font-black ${m.delta > 0 ? 'text-emerald-500' : 'text-rose-500'}`} dir="ltr">{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white" dir="ltr">{m.stockAfter}</td>
                <td className="px-4 py-2.5 text-xs">
                  <span className="text-gray-700 dark:text-zinc-300">{t(`reason.${m.reason}`)}</span>
                  {m.orderId && <span className="block text-[11px] text-indigo-500">{t('order', { id: String(m.orderId).slice(0, 8) })}</span>}
                  {m.note && <span className="block text-[11px] text-gray-400">{m.note}</span>}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{m.userName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-40">{t('prev')}</button>
          <span className="text-gray-500" dir="ltr">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 disabled:opacity-40">{t('next')}</button>
        </div>
      )}
    </div>
  );
}

// تطبيق المخزون (MD Stock): دخول مباشر برمز لمرة واحدة — لا يمرّ رمز الجلسة في الرابط
const STOCK_URL = import.meta.env.VITE_STOCK_URL || 'https://stock.mdstore.top';

async function openStockApp(storeId) {
  const win = window.open('about:blank', '_blank'); // فوراً عند الضغط، قبل الطلب، حتى لا يمنعه المتصفح
  try {
    const { data } = await axios.post(`${baseURL}/auth/handoff`, {}, headers());
    const url = `${STOCK_URL}/handoff?code=${encodeURIComponent(data.code)}&store=${encodeURIComponent(storeId)}`;
    if (win) win.location.href = url; else window.location.href = url;
  } catch {
    if (win) win.location.href = `${STOCK_URL}/login`;
  }
}

export default function Inventory() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'inventory' });
  const [storeId] = useState(() => localStorage.getItem('storeId'));
  const [tab, setTab] = useState('stock');
  const isRtl = i18n.language === 'ar';

  return (
    <div className="p-4 md:p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><Boxes className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-gray-400">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
        <button type="button" onClick={() => openStockApp(storeId)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500">
          <ExternalLink className="w-3.5 h-3.5" />{t('open_app')}
        </button>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
          {['stock', 'history'].map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === k ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              {t(`tab_${k}`)}
            </button>
          ))}
        </div>
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />{t('auto_note')}
      </p>
      {storeId && (tab === 'stock' ? <StockTab storeId={storeId} /> : <HistoryTab storeId={storeId} />)}
    </div>
  );
}
