// الأطقم (باندل): عدة منتجات تُطلب معاً بخصم — تظهر في سلايدر «عروض الأطقم» بالرئيسية ولكل طقم صفحة طلب.
// الخادم يحسب سعر الطلب؛ ما يظهر هنا معاينة بسعر المنتج قبل النسخ.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  Gift, Plus, Pencil, Trash2, Copy, ExternalLink, Loader2, X, Search, ImagePlus, ArrowUp, ArrowDown, Check, AlertTriangle,
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import ModelImages from '../../../components/ModelImages';
import NoStoreState from '../../../components/NoStoreState';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} DA`;
const discounted = (total, pct) => Math.round((total * (100 - pct)) / 100);
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

const input = 'w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30';
const label = 'block text-xs font-bold text-gray-600 dark:text-zinc-300 mb-1.5';

/* ── صورة البانر (كمبيوتر / هاتف) ── */
function BannerPick({ value, onChange, tall, title, hint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className={label}>{title}</p>
      <button type="button" onClick={() => setOpen(true)}
        style={{ aspectRatio: tall ? '4 / 5' : '16 / 8' }}
        className={`relative w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 overflow-hidden flex items-center justify-center text-gray-400`}>
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-6 h-6" />}
      </button>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-rose-500">✕</button>}
      <ModelImages isOpen={open} close={() => setOpen(false)} initialFolder="bundle"
        onSelectImage={(img) => { onChange(img?.url || img?.imageUrl || null); setOpen(false); }} />
    </div>
  );
}

/* ── اختيار المنتجات (بحث + قائمة مرتّبة) ── */
function ProductPicker({ storeId, selected, onChange }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: '1', limit: '20', ...(q.trim() && { search: q.trim() }) });
        const { data } = await axios.get(`${baseURL}/stores/${storeId}/products?${params}`, auth());
        if (alive) setResults((data.products || []).filter((p) => !p.isArchived));
      } catch { if (alive) setResults([]); } finally { if (alive) setLoading(false); }
    }, 300);
    return () => { alive = false; clearTimeout(id); };
  }, [q, storeId]);

  const has = (id) => selected.some((p) => p.id === id);
  const add = (p) => {
    if (has(p.id)) return;
    if (selected.length >= 10) { toast.error(t('max_products')); return; }
    onChange([...selected, { id: p.id, name: p.name, price: Number(p.price), imageUrl: imgOf(p) }]);
  };
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
            <li key={p.id} className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-zinc-700">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800" />}
              <span className="flex-1 min-w-0 text-sm font-semibold truncate">{p.name}</span>
              <span className="text-xs text-gray-500 shrink-0">{money(p.price)}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('move_up')} className="p-1.5 rounded-lg text-gray-400 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} aria-label={t('move_down')} className="p-1.5 rounded-lg text-gray-400 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" onClick={() => onChange(selected.filter((x) => x.id !== p.id))} aria-label={t('remove')} className="p-1.5 rounded-lg text-rose-500"><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ol>
      )}

      <div className="relative">
        <Search className="absolute top-3 start-3 w-4 h-4 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_products')} className={`${input} ps-9`} />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
        {loading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          : results.length === 0 ? <p className="text-center text-xs text-gray-400 py-6">{t('no_products')}</p>
          : results.map((p) => (
            <button key={p.id} type="button" onClick={() => add(p)} disabled={has(p.id)}
              className="w-full flex items-center gap-2 p-2 text-start hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50">
              {imgOf(p) ? <img src={imgOf(p)} alt="" className="w-9 h-9 rounded-lg object-cover" /> : <span className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800" />}
              <span className="flex-1 min-w-0 text-sm truncate">{p.name}{!p.isActive && <span className="ms-1 text-[10px] text-amber-600">({t('inactive')})</span>}</span>
              <span className="text-xs text-gray-500">{money(p.price)}</span>
              {has(p.id) ? <Check className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4 text-indigo-500" />}
            </button>
          ))}
      </div>
    </div>
  );
}

/* ── إنشاء / تعديل طقم ── */
function BundleEditor({ storeId, bundle, onClose, onSaved }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [f, setF] = useState(() => ({
    name: bundle?.name || '',
    subtitle: bundle?.subtitle || '',
    discountPercent: bundle?.discountPercent ?? 10,
    products: (bundle?.items || []).map((i) => ({ id: i.productId, name: i.name, price: i.price, imageUrl: i.imageUrl })),
    imageUrl: bundle?.imageUrl || bundle?.mobileImageUrl || null,
    isActive: bundle?.isActive ?? true,
    showOnHome: bundle?.showOnHome ?? true,
    startsAt: toLocalInput(bundle?.startsAt),
    endsAt: toLocalInput(bundle?.endsAt),
  }));
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const original = f.products.reduce((s, p) => s + Number(p.price || 0), 0);
  const pct = Math.min(90, Math.max(1, Number(f.discountPercent) || 0));
  const price = discounted(original, pct);

  const save = async () => {
    if (!f.name.trim()) { toast.error(t('err_name')); return; }
    if (f.products.length < 2) { toast.error(t('err_products')); return; }
    if (!(Number(f.discountPercent) >= 1 && Number(f.discountPercent) <= 90)) { toast.error(t('err_discount')); return; }
    setSaving(true);
    const body = {
      name: f.name.trim(),
      subtitle: f.subtitle.trim() || null,
      discountPercent: Math.round(Number(f.discountPercent)),
      productIds: f.products.map((p) => p.id),
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
      toast.success(t('saved'));
      onSaved();
    } catch (e) {
      toast.error(errMsg(e, t('save_failed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col" role="dialog" aria-modal="true" aria-label={bundle ? t('edit') : t('new')}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="font-black text-gray-900 dark:text-white">{bundle ? t('edit') : t('new')}</h2>
          <button type="button" onClick={onClose} aria-label={t('close')} className="p-2 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="grid sm:grid-cols-[1fr_140px] gap-3">
            <div>
              <label className={label} htmlFor="bn-name">{t('name')}</label>
              <input id="bn-name" value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder={t('name_ph')} className={input} maxLength={120} />
            </div>
            <div>
              <label className={label} htmlFor="bn-pct">{t('discount')}</label>
              <div className="relative">
                <input id="bn-pct" type="number" inputMode="numeric" min="1" max="90" dir="ltr" value={f.discountPercent}
                  onChange={(e) => set('discountPercent')(e.target.value)} className={`${input} pe-8`} />
                <span className="absolute top-3 end-3 text-sm text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div>
            <label className={label} htmlFor="bn-sub">{t('subtitle')}</label>
            <input id="bn-sub" value={f.subtitle} onChange={(e) => set('subtitle')(e.target.value)} placeholder={t('subtitle_ph')} className={input} maxLength={200} />
          </div>

          <div>
            <p className={label}>{t('products')} <span className="font-normal text-gray-400">({t('products_hint')})</span></p>
            <ProductPicker storeId={storeId} selected={f.products} onChange={set('products')} />
          </div>

          {f.products.length >= 2 && (
            <div className="rounded-xl p-3 bg-indigo-50 dark:bg-indigo-500/10 text-sm space-y-1">
              <div className="flex justify-between"><span>{t('original')}</span><s className="text-gray-500">{money(original)}</s></div>
              <div className="flex justify-between font-black"><span>{t('bundle_price')}</span><span className="text-indigo-600 dark:text-indigo-400">{money(price)}</span></div>
              <div className="flex justify-between text-emerald-600 font-bold"><span>{t('saving')}</span><span>{money(original - price)}</span></div>
              <p className="text-[11px] text-gray-500 pt-1">{t('price_note')}</p>
            </div>
          )}

          <BannerPick value={f.imageUrl} onChange={set('imageUrl')} title={t('banner')} hint={t('banner_hint')} />

          <div className="space-y-2">
            {[['isActive', t('active')], ['showOnHome', t('show_on_home')]].map(([k, text]) => (
              <label key={k} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 cursor-pointer">
                <span className="text-sm font-semibold">{text}</span>
                <input type="checkbox" checked={f[k]} onChange={(e) => set(k)(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
              </label>
            ))}
            {!f.showOnHome && <p className="text-[11px] text-gray-400">{t('hidden_home_hint')}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="bn-start">{t('starts')}</label>
              <input id="bn-start" type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt')(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="bn-end">{t('ends')}</label>
              <input id="bn-end" type="datetime-local" value={f.endsAt} onChange={(e) => set('endsAt')(e.target.value)} className={input} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={save} disabled={saving}
            className="w-full h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── عنوان قسم الأطقم في الرئيسية: خانة + حفظ — فارغة = بلا عنوان ── */
// العنوان الافتراضي بلغة المتجر (ما يظهر في المتجر ما دام التاجر لم يحفظ عنواناً)
const DEFAULT_TITLE = { ar: 'عروض الأطقم', fr: 'Nos packs', en: 'Bundle deals' };

function SliderTitle({ storeId, value, language, onSaved }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [text, setText] = useState(value === null || value === undefined ? (DEFAULT_TITLE[language] || DEFAULT_TITLE.ar) : value);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const bundlesTitle = text.trim(); // '' = القسم بلا عنوان
    setSaving(true);
    try {
      await axios.patch(`${baseURL}/stores/${storeId}`, { design: { bundlesTitle } }, auth());
      toast.success(bundlesTitle ? t('saved') : t('title_removed'));
      onSaved(bundlesTitle);
    } catch (err) {
      toast.error(errMsg(err, t('save_failed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
      <label htmlFor="bn-section-title" className={label}>{t('slider_title')}</label>
      <div className="flex gap-2">
        <input id="bn-section-title" value={text} onChange={(e) => setText(e.target.value)} maxLength={60} placeholder={t('title_empty_ph')} className={`${input} flex-1`} />
        <button type="submit" disabled={saving} className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-2 shrink-0">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}{t('save')}
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">{t('title_hint')}</p>
    </form>
  );
}

/* ── الصفحة ── */
export default function Bundles() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'bundles' });
  const [storeId] = useState(() => localStorage.getItem('storeId'));
  const [store, setStore] = useState(null);
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | bundle
  const isRtl = i18n.language === 'ar';

  const fetchList = useCallback(
    () => axios.get(`${baseURL}/stores/${storeId}/bundles`, auth())
      .then((r) => r.data || [])
      .catch((e) => { toast.error(errMsg(e, t('load_failed'))); return []; }),
    [storeId, t],
  );
  const load = () => fetchList().then(setList);

  useEffect(() => {
    if (!storeId) return undefined;
    let alive = true;
    fetchList().then((d) => { if (alive) setList(d); });
    return () => { alive = false; };
  }, [storeId, fetchList]);
  useEffect(() => {
    if (!storeId) return;
    axios.get(`${baseURL}/stores/${storeId}`, auth()).then((r) => setStore(r.data?.data ?? r.data)).catch(() => setStore({}));
  }, [storeId]);

  // هل يعرض ثيم المتجر الأطقم في الرئيسية؟ (ملف الثيم يستعمل useBundleOrder) — null = لم يُعرف بعد
  const [themeSupports, setThemeSupports] = useState(null);
  useEffect(() => {
    const sub = store?.subdomain;
    if (!sub) return undefined;
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(`${baseURL}/stores/domain/${sub}`);
        const slug = (data?.data ?? data)?.theme?.slug || 'default';
        const code = await (await fetch(`https://${sub}.mdstore.top/api/themes/${slug}`)).text();
        if (alive) setThemeSupports(code.includes('useBundleOrder'));
      } catch { /* لا تنبيه إن تعذّر الفحص */ }
    })();
    return () => { alive = false; };
  }, [store?.subdomain]);

  const linkOf = useMemo(() => (b) => (store?.subdomain ? `https://${store.subdomain}.mdstore.top/bundle/${b.slug}` : ''), [store]);

  const toggle = async (b, key = 'isActive') => {
    try {
      await axios.patch(`${baseURL}/stores/${storeId}/bundles/${b.id}`, { [key]: !b[key] }, auth());
      load();
    } catch (e) { toast.error(errMsg(e, t('save_failed'))); }
  };
  const remove = async (b) => {
    if (!window.confirm(t('confirm_delete', { name: b.name }))) return;
    try {
      await axios.delete(`${baseURL}/stores/${storeId}/bundles/${b.id}`, auth());
      toast.success(t('deleted'));
      load();
    } catch (e) { toast.error(errMsg(e, t('save_failed'))); }
  };
  const copy = async (b) => {
    try { await navigator.clipboard.writeText(linkOf(b)); toast.success(t('copied')); } catch { toast.error(linkOf(b)); }
  };

  if (!storeId) return <NoStoreState />;

  return (
    <div className="p-4 md:p-6 space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><Gift className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-gray-500">{t('subtitle_page')}</p>
          </div>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('new')}
        </button>
      </div>

      {themeSupports === false && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">{t('theme_unsupported_title')}</p>
            <p className="text-xs leading-relaxed opacity-90">{t('theme_unsupported_desc')}</p>
          </div>
        </div>
      )}

      {store && <SliderTitle key={String(store?.design?.bundlesTitle)} storeId={storeId} value={store?.design?.bundlesTitle} language={store?.language}
        onSaved={(v) => setStore((s) => ({ ...s, design: { ...(s?.design || {}), bundlesTitle: v } }))} />}

      {list === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 p-10 text-center space-y-3">
          <Gift className="w-10 h-10 mx-auto text-gray-300" />
          <p className="font-bold text-gray-700 dark:text-zinc-200">{t('empty_title')}</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{t('empty_desc')}</p>
          <button type="button" onClick={() => setEditing('new')} className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-bold inline-flex items-center gap-2"><Plus className="w-4 h-4" />{t('new')}</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800 overflow-hidden">
          {list.map((b) => (
            <article key={b.id} className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 ${b.isActive ? '' : 'opacity-60'}`}>
              {/* الصورة + الاسم + المنتجات */}
              <div className="flex items-center gap-3 min-w-0 md:flex-1">
                <div className="relative w-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800" style={{ aspectRatio: '16 / 9' }}>
                  {b.imageUrl || b.mobileImageUrl
                    ? <img src={b.imageUrl || b.mobileImageUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="flex w-full h-full items-center justify-center text-gray-300"><ImagePlus className="w-5 h-5" /></span>}
                  <span className="absolute top-1 start-1 px-1.5 py-px rounded-md bg-red-700 text-white text-[10px] font-bold">-{b.discountPercent}%</span>
                </div>
                <div className="min-w-0 space-y-1.5">
                  <h3 className="font-black text-gray-900 dark:text-white truncate">{b.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 rtl:space-x-reverse">
                      {b.items.slice(0, 5).map((it) => (
                        it.imageUrl
                          ? <img key={it.productId} src={it.imageUrl} alt={it.name} title={it.name} className="w-7 h-7 rounded-md object-cover border-2 border-white dark:border-zinc-900 bg-white" />
                          : <span key={it.productId} title={it.name} className="w-7 h-7 rounded-md bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{t('products_count', { count: b.items.length })}</span>
                    {!b.available && <span className="px-1.5 py-px rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold">{t('unavailable')}</span>}
                  </div>
                </div>
              </div>

              {/* السعر */}
              <div className="flex md:flex-col items-baseline md:items-end gap-2 md:gap-0.5 md:w-36 shrink-0">
                <b className="text-indigo-600 dark:text-indigo-400">{money(b.price)}</b>
                <s className="text-xs text-gray-400">{money(b.original)}</s>
                <span className="text-[11px] text-emerald-600 font-bold">{t('save_short')} {money(b.saving)}</span>
              </div>

              {/* المفاتيح + الأزرار */}
              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0">
                {[['isActive', t('active')], ['showOnHome', t('on_home')]].map(([k, text]) => (
                  <button key={k} type="button" role="switch" aria-checked={!!b[k]} onClick={() => toggle(b, k)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${b[k] ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${b[k] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`} />{text}
                  </button>
                ))}
                <div className="flex items-center ms-auto md:ms-2">
                  {linkOf(b) && <a href={linkOf(b)} target="_blank" rel="noreferrer" aria-label={t('open')} title={t('open')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><ExternalLink className="w-4 h-4" /></a>}
                  {linkOf(b) && <button type="button" onClick={() => copy(b)} aria-label={t('copy_link')} title={t('copy_link')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><Copy className="w-4 h-4" /></button>}
                  <button type="button" onClick={() => setEditing(b)} aria-label={t('edit')} title={t('edit')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><Pencil className="w-4 h-4" /></button>
                  <button type="button" onClick={() => remove(b)} aria-label={t('delete')} title={t('delete')} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}


      {editing && (
        <BundleEditor storeId={storeId} bundle={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}
