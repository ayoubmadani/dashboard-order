// صفحة إنشاء طقم (/dashboard/bundles/new) أو تعديله (/dashboard/bundles/:id):
// التاجر يكتب سعر كل منتج داخل الطقم والنسبة تُحسب تلقائياً — الخادم يحسب سعر الطلب من أسعار الطقم.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  Plus, Loader2, X, Search, ImagePlus, ArrowUp, ArrowDown, ArrowLeft, Check, Gift, ChevronDown,
  FileText, Package, Image as ImageIcon, Receipt, CalendarClock, Save,
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import ModelImages from '../../../components/ModelImages';
import NoStoreState from '../../../components/NoStoreState';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} DA`;
// نسبة التوفير تلقائياً (نفس حساب الخادم)
const percentOf = (original, price) => (original > 0 && price < original ? Math.round(((original - price) * 100) / original) : 0);
const errMsg = (e, fallback) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || fallback;
};
const imgOf = (p) => p?.imagesProduct?.[0]?.imageUrl || p?.imageUrl || null;
// datetime-local ↔ ISO
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const input = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm text-gray-900 dark:text-white outline-none transition-all focus:border-indigo-400';
const label = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5';

/* ── قسم في الصفحة — نفس شكل صفحة إنشاء المنتج ── */
const SECTION_COLORS = {
  indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
  purple: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
  teal: 'text-teal-500 bg-teal-50 dark:bg-teal-500/10',
  rose: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
  blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
};
function Section({ icon, title, desc, aside, color = 'indigo', children }) {
  const Icon = icon;
  return (
    <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
        <div className={`p-2 rounded-lg ${SECTION_COLORS[color]}`}><Icon size={16} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide">{title}</h2>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
        {aside}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function Switch({ checked, onChange, label: text }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={text} onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
      <span className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
    </button>
  );
}

/* ── صورة الطقم ── */
function BannerPick({ value, onChange }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [open, setOpen] = useState(false);
  return (
    <div>
      {value ? (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <img src={value} alt="" className="w-full sm:w-72 rounded-xl object-cover border border-gray-200 dark:border-zinc-700" style={{ aspectRatio: '16 / 8' }} />
          <div className="flex sm:flex-col gap-2">
            <button type="button" onClick={() => setOpen(true)} className="h-10 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800">{t('image_change')}</button>
            <button type="button" onClick={() => onChange(null)} className="h-10 px-4 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">{t('image_remove')}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="w-full h-36 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 hover:border-indigo-300 dark:hover:border-indigo-500/40 flex flex-col items-center justify-center gap-2 text-gray-400">
          <ImagePlus className="w-6 h-6" />
          <span className="text-sm font-semibold">{t('image_pick')}</span>
        </button>
      )}
      <ModelImages isOpen={open} close={() => setOpen(false)} initialFolder="bundle"
        onSelectImage={(img) => { onChange(img?.url || img?.imageUrl || null); setOpen(false); }} />
    </div>
  );
}

/* ── خيارات منتج داخل الطقم: لكل خيار (مقاس/لون) سعر خاص أو إيقافه في الطقم ── */
// اسم الخيار: [{attrName, displayMode, value, label}] (أو الشكل القديم {Color: '#f00'})
const entriesOf = (name) => (Array.isArray(name) ? name : Object.entries(name || {}).map(([attrName, value]) => ({ attrName, value, displayMode: /^#/.test(String(value)) ? 'color' : 'text' })));

function OptionLabel({ name }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 min-w-0">
      {entriesOf(name).map((e, k) => (
        <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-200">
          {e.displayMode === 'color' && <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: e.value }} />}
          {e.displayMode === 'image' && <img src={e.value} alt="" className="w-5 h-5 rounded object-cover" />}
          {e.displayMode === 'color' || e.displayMode === 'image' ? e.label : e.value}
        </span>
      ))}
    </span>
  );
}

function ProductOptions({ storeId, item, onChange }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [details, setDetails] = useState(null); // null = يُحمَّل
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    axios.get(`${baseURL}/stores/${storeId}/products/${item.id}`, auth())
      .then((r) => { if (alive) setDetails((r.data?.data ?? r.data)?.variantDetails || []); })
      .catch(() => { if (alive) setDetails([]); });
    return () => { alive = false; };
  }, [storeId, item.id]);

  if (details === null) return <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-300" /></div>;
  if (!details.length) return null;

  const cfg = item.variants || {};
  const setV = (vid, patch) => onChange({ ...cfg, [vid]: { ...cfg[vid], ...patch } });
  const active = details.filter((d) => d.isActive !== false);
  const offCount = active.filter((d) => cfg[d.id]?.off).length;
  const setAll = (off) => onChange(Object.fromEntries([
    ...Object.entries(cfg),
    ...active.map((d) => [d.id, { ...cfg[d.id], off }]),
  ]));
  const customCount = active.filter((d) => cfg[d.id]?.price !== undefined && cfg[d.id]?.price !== null && cfg[d.id]?.price !== '').length;

  return (
    <div className="border-t border-gray-100 dark:border-zinc-800 pt-2">
      <div className="flex items-center gap-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex-1 min-w-0 flex items-center justify-between gap-2 text-xs font-bold text-gray-600 dark:text-zinc-300 py-1">
        <span>
          {t('options')} ({active.length})
          {offCount > 0 && <span className="ms-2 text-rose-600">{t('options_off', { count: offCount })}</span>}
          {customCount > 0 && <span className="ms-2 text-indigo-600 dark:text-indigo-400">{t('options_custom', { count: customCount })}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
        {/* كل الخيارات المتاحة في المنتج دفعة واحدة */}
        <button type="button" onClick={() => setAll(true)} disabled={offCount === active.length}
          className="h-7 px-2.5 rounded-lg text-[11px] font-bold border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-40 shrink-0">
          {t('options_all_off')}
        </button>
        <button type="button" onClick={() => setAll(false)} disabled={offCount === 0}
          className="h-7 px-2.5 rounded-lg text-[11px] font-bold border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-40 shrink-0">
          {t('options_all_on')}
        </button>
      </div>
      {open && (
        <ul className="mt-1.5 space-y-1.5">
          {details.map((d) => {
            const disabled = d.isActive === false; // معطّل من صفحة المنتج — لا يظهر في المتجر أصلاً
            const off = !!cfg[d.id]?.off;
            const regular = Number(d.price) > 0 ? Number(d.price) : Number(item.price);
            return (
              <li key={d.id} className={`flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-lg ${disabled || off ? 'bg-gray-50 dark:bg-zinc-950 opacity-60' : 'bg-gray-50/60 dark:bg-zinc-950/60'}`}>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <OptionLabel name={d.name} />
                  <p className="text-[11px] text-gray-400">
                    {t('regular')}: {money(regular)}
                    {disabled && <span className="ms-2 text-amber-600">{t('option_disabled_product')}</span>}
                  </p>
                </div>
                {!disabled && (
                  <>
                    <label className="shrink-0">
                      <span className="sr-only">{t('option_price')}</span>
                      <div dir="ltr" className="relative w-28">
                        <input type="number" inputMode="numeric" min="0" dir="ltr" disabled={off}
                          value={cfg[d.id]?.price ?? ''} placeholder={item.bundlePrice || t('in_bundle')}
                          onChange={(e) => setV(d.id, { price: e.target.value })}
                          className="w-full h-8 pl-2.5 pr-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50" />
                        <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-2.5 text-[11px] font-semibold text-gray-400">DA</span>
                      </div>
                    </label>
                    <button type="button" role="switch" aria-checked={!off} onClick={() => setV(d.id, { off: !off })}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border shrink-0 ${off ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                      <span className={`w-2 h-2 rounded-full ${off ? 'bg-rose-500' : 'bg-emerald-500'}`} />{off ? t('option_off') : t('option_on')}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-gray-400 mt-1.5">{t('options_hint')}</p>
    </div>
  );
}

/* ── نافذة اختيار المنتجات: بحث + تحديد عدة منتجات ثم «تم» ── */
const PAGE = 20;
function ProductPickerModal({ storeId, selected, onClose, onDone }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  // المسودة: المنتجات المحددة بالترتيب (الموجودة تحتفظ بأسعارها وخياراتها)
  const [draft, setDraft] = useState(selected);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE), ...(q.trim() && { search: q.trim() }) });
        const { data } = await axios.get(`${baseURL}/stores/${storeId}/products?${params}`, auth());
        const list = data.products || [];
        if (alive) {
          setResults((prev) => (page === 1 ? list : [...prev, ...list]).filter((p) => !p.isArchived));
          setMore(list.length === PAGE);
        }
      } catch { if (alive && page === 1) setResults([]); } finally { if (alive) setLoading(false); }
    }, page === 1 ? 300 : 0);
    return () => { alive = false; clearTimeout(id); };
  }, [q, page, storeId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const has = (id) => draft.some((p) => p.id === id);
  const toggle = (p) => {
    if (has(p.id)) { setDraft((d) => d.filter((x) => x.id !== p.id)); return; }
    if (draft.length >= 10) { toast.error(t('max_products')); return; }
    setDraft((d) => [...d, { id: p.id, name: p.name, price: Number(p.price), bundlePrice: String(Math.round(Number(p.price) || 0)), variants: {}, imageUrl: imgOf(p) }]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t('pick_products')}
        className="bg-white dark:bg-zinc-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl max-h-[88dvh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{t('pick_products')}</h2>
            <p className="text-xs text-gray-400">{t('products_hint')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="absolute top-3 start-3 w-4 h-4 text-gray-400" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t('search_products')} className={`${input} ps-9`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && page === 1 ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">{t('no_products')}</p>
          ) : (
            <ul className="space-y-1.5">
              {results.map((p) => {
                const on = has(p.id);
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => toggle(p)} aria-pressed={on}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-start transition-colors ${on ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/40' : 'border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                      <span className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${on ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-zinc-600'}`}>
                        {on && <Check className="w-3.5 h-3.5" />}
                      </span>
                      {imgOf(p) ? <img src={imgOf(p)} alt="" className="w-11 h-11 rounded-lg object-cover" /> : <span className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-zinc-800" />}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-800 dark:text-zinc-100 truncate">{p.name}</span>
                        {!p.isActive && <span className="text-[11px] text-amber-600">{t('inactive')}</span>}
                      </span>
                      <span className="text-sm font-bold text-gray-600 dark:text-zinc-300 shrink-0">{money(p.price)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {more && !loading && results.length > 0 && (
            <button type="button" onClick={() => setPage((n) => n + 1)} className="w-full mt-3 h-10 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">{t('load_more')}</button>
          )}
          {loading && page > 1 && <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <span className="text-sm text-gray-500">{t('selected_count', { count: draft.length })} <bdi dir="ltr" className="text-gray-400">/10</bdi></span>
          <button type="button" onClick={() => onDone(draft)}
            className="ms-auto px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700">
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── منتجات الطقم: القائمة المرتّبة (سعر كل منتج وخياراته) + زر يفتح نافذة الاختيار ── */
function ProductPicker({ storeId, selected, onChange }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [picking, setPicking] = useState(false);
  const setPrice = (id, v) => onChange(selected.map((x) => (x.id === id ? { ...x, bundlePrice: v } : x)));
  const setVariants = (id, variants) => onChange(selected.map((x) => (x.id === id ? { ...x, variants } : x)));
  const move = (i, d) => {
    const next = [...selected];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <ol className="space-y-2">
          {selected.map((p, i) => (
            <li key={p.id} className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-2">
              <div className="flex items-center gap-2">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-[11px] text-gray-400">{t('regular')}: {money(p.price)}</p>
              </div>
              <label className="shrink-0">
                <span className="sr-only">{t('in_bundle')} — {p.name}</span>
                <div dir="ltr" className="relative w-28">
                  <input type="number" inputMode="numeric" min="0" dir="ltr" value={p.bundlePrice ?? ''} placeholder={t('in_bundle')}
                    onChange={(e) => setPrice(p.id, e.target.value)}
                    className="w-full h-9 pl-2.5 pr-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-2.5 text-[11px] font-semibold text-gray-400">DA</span>
                </div>
              </label>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('move_up')} className="p-1.5 rounded-lg text-gray-400 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} aria-label={t('move_down')} className="p-1.5 rounded-lg text-gray-400 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" onClick={() => onChange(selected.filter((x) => x.id !== p.id))} aria-label={t('remove')} className="p-1.5 rounded-lg text-rose-500"><X className="w-4 h-4" /></button>
              </div>
              <ProductOptions storeId={storeId} item={p} onChange={(v) => setVariants(p.id, v)} />
            </li>
          ))}
        </ol>
      )}

      <button type="button" onClick={() => setPicking(true)}
        className="w-full h-11 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" />{t('add_products')}
      </button>

      {picking && (
        <ProductPickerModal storeId={storeId} selected={selected} onClose={() => setPicking(false)}
          onDone={(list) => { onChange(list); setPicking(false); }} />
      )}
    </div>
  );
}

/* ── نموذج إنشاء / تعديل طقم ── */
function BundleForm({ storeId, bundle, onSaved }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'bundles' });
  const isRtl = i18n.language === 'ar';
  const [f, setF] = useState(() => ({
    name: bundle?.name || '',
    subtitle: bundle?.subtitle || '',
    products: (bundle?.items || []).map((i) => ({ id: i.productId, name: i.name, price: i.price, bundlePrice: String(i.bundlePrice ?? i.price), variants: i.variants || {}, imageUrl: i.imageUrl })),
    imageUrl: bundle?.imageUrl || bundle?.mobileImageUrl || null,
    isActive: bundle?.isActive ?? true,
    showOnHome: bundle?.showOnHome ?? true,
    startsAt: toLocalInput(bundle?.startsAt),
    endsAt: toLocalInput(bundle?.endsAt),
  }));
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const original = f.products.reduce((s, p) => s + Number(p.price || 0), 0);
  const price = f.products.reduce((s, p) => s + (Number(p.bundlePrice) || 0), 0);
  const pct = percentOf(original, price);

  const save = async () => {
    if (!f.name.trim()) { toast.error(t('err_name')); return; }
    if (f.products.length < 2) { toast.error(t('err_products')); return; }
    if (f.products.some((p) => p.bundlePrice === '' || !(Number(p.bundlePrice) >= 0))) { toast.error(t('err_price')); return; }
    if (price <= 0) { toast.error(t('err_price')); return; }
    if (price >= original) { toast.error(t('err_discount')); return; }
    setSaving(true);
    const body = {
      name: f.name.trim(),
      subtitle: f.subtitle.trim() || null,
      items: f.products.map((p) => ({
        productId: p.id, price: Number(p.bundlePrice),
        variants: Object.entries(p.variants || {}).map(([variantDetailId, v]) => ({
          variantDetailId, off: !!v.off,
          price: v.price === '' || v.price === undefined || v.price === null ? null : Number(v.price),
        })).filter((v) => v.off || v.price !== null),
      })),
      imageUrl: f.imageUrl,
      mobileImageUrl: null, // صورة واحدة للطقم
      isActive: f.isActive,
      showOnHome: f.showOnHome,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
    };
    try {
      if (bundle) await axios.patch(`${baseURL}/stores/${storeId}/bundles/${bundle.id}`, body, auth());
      else await axios.post(`${baseURL}/stores/${storeId}/bundles`, body, auth());
      onSaved();
    } catch (e) {
      toast.error(errMsg(e, t('save_failed')));
    } finally {
      setSaving(false);
    }
  };

  const ready = f.products.length >= 2;

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 pt-4 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3 py-2">
        <Link to="/dashboard/bundles" aria-label={t('back')} title={t('back')}
          className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift size={20} className="text-indigo-500" />
            <span className="truncate">{bundle ? t('edit') : t('new')}</span>
          </h1>
          <p className="text-xs text-gray-400">{t('sec_info_desc')}</p>
        </div>
      </div>

      {/* ── 1. المعلومات الأساسية ── */}
      <Section icon={FileText} title={t('sec_info')} color="indigo">
        <div>
          <label className={label} htmlFor="bn-name">{t('name')} <span className="text-rose-500">*</span></label>
          <input id="bn-name" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder={t('name_ph')} className={input} maxLength={120} />
        </div>
        <div>
          <label className={label} htmlFor="bn-sub">{t('subtitle')}</label>
          <input id="bn-sub" value={f.subtitle} onChange={(e) => set('subtitle')(e.target.value)} placeholder={t('subtitle_ph')} className={input} maxLength={200} />
        </div>
        {[['isActive', t('active'), t('active_hint')], ['showOnHome', t('show_on_home'), t('hidden_home_hint')]].map(([k, text, hint]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-700 dark:text-zinc-200">{text}</span>
              <span className="block text-[11px] text-gray-400">{hint}</span>
            </span>
            <Switch checked={f[k]} onChange={(v) => set(k)(v)} label={text} />
          </div>
        ))}
      </Section>

      {/* ── 2. المنتجات والأسعار ── */}
      <Section icon={Package} title={t('sec_products')} desc={t('products_hint')} color="purple"
        aside={<span className="text-xs font-mono text-gray-400"><bdi dir="ltr">{f.products.length}/10</bdi></span>}>
        <ProductPicker storeId={storeId} selected={f.products} onChange={set('products')} />
      </Section>

      {/* ── 3. ملخص السعر ── */}
      <Section icon={Receipt} title={t('sec_summary')} color="teal">
        {ready ? (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700">
              <p className="text-xs text-gray-400">{t('original')}</p>
              <s className="text-lg font-bold text-gray-500">{money(original)}</s>
            </div>
            <div className="rounded-xl p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <p className="text-xs text-indigo-500">{t('bundle_price')}</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{money(price)}</p>
            </div>
            <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-xs text-emerald-600">{t('saving')}</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                {money(Math.max(0, original - price))}
                {pct > 0 && <bdi dir="ltr" className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-xs">-{pct}%</bdi>}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('summary_empty')}</p>
        )}
        {ready && price >= original && <p className="text-xs text-rose-600 font-semibold">{t('err_discount')}</p>}
        <p className="text-xs text-gray-400">{t('price_note')}</p>
      </Section>

      {/* ── 4. صورة الطقم ── */}
      <Section icon={ImageIcon} title={t('banner')} desc={t('banner_hint')} color="blue">
        <BannerPick value={f.imageUrl} onChange={set('imageUrl')} />
      </Section>

      {/* ── 5. مدة العرض ── */}
      <Section icon={CalendarClock} title={t('sec_schedule')} desc={t('sec_schedule_desc')} color="rose">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="bn-start">{t('starts')}</label>
            <input id="bn-start" type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt')(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label} htmlFor="bn-end">{t('ends')}</label>
            <input id="bn-end" type="datetime-local" value={f.endsAt} onChange={(e) => set('endsAt')(e.target.value)} className={input} />
          </div>
        </div>
      </Section>

      {/* ── الأزرار ── */}
      <div className="flex gap-4 pt-2">
        <Link to="/dashboard/bundles"
          className="px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold text-gray-700 dark:text-zinc-300 hover:scale-105 transition-all">
          {t('cancel')}
        </Link>
        <button type="button" onClick={save} disabled={saving}
          className="flex-1 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}{t('save')}
        </button>
      </div>
    </div>
  );
}

/* ── الصفحة: طقم جديد، أو تحميل الطقم ثم تعديله ── */
export default function BundleEdit() {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const { id } = useParams();
  const navigate = useNavigate();
  const [storeId] = useState(() => localStorage.getItem('storeId'));
  const [bundle, setBundle] = useState(id ? undefined : null); // undefined = يُحمَّل، false = غير موجود

  useEffect(() => {
    if (!id || !storeId) return undefined;
    let alive = true;
    axios.get(`${baseURL}/stores/${storeId}/bundles/${id}`, auth())
      .then((r) => { if (alive) setBundle(r.data); })
      .catch((e) => { if (alive) { setBundle(false); toast.error(errMsg(e, t('load_failed'))); } });
    return () => { alive = false; };
  }, [id, storeId, t]);

  if (!storeId) return <NoStoreState />;

  return (
    <>
      <Toaster position="top-center" richColors />
      {bundle === undefined ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : bundle === false ? (
        <div className="p-10 text-center space-y-3">
          <Gift className="w-10 h-10 mx-auto text-gray-300" />
          <p className="font-bold text-gray-700 dark:text-zinc-200">{t('not_found')}</p>
          <Link to="/dashboard/bundles" className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-bold inline-flex items-center">{t('back')}</Link>
        </div>
      ) : (
        <BundleForm key={bundle?.id || 'new'} storeId={storeId} bundle={bundle}
          onSaved={() => navigate('/dashboard/bundles', { state: { saved: true } })} />
      )}
    </>
  );
}
