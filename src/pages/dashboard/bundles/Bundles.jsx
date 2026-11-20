// الأطقم (باندل): عدة منتجات تُطلب معاً بخصم — تظهر في سلايدر «عروض الأطقم» بالرئيسية ولكل طقم صفحة طلب.
// الخادم يحسب سعر الطلب؛ ما يظهر هنا معاينة بسعر المنتج قبل النسخ.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  Gift, Plus, Pencil, Trash2, Copy, ExternalLink, Loader2, X, Search, ImagePlus, ArrowUp, ArrowDown, Check, EyeOff,
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

/* ── عنوان السلايدر في الرئيسية ── */
function SliderTitle({ storeId, value, onSaved }) {
  const { t } = useTranslation('translation', { keyPrefix: 'bundles' });
  const initialMode = value === null || value === undefined ? 'default' : value === '' ? 'none' : 'custom';
  const [mode, setMode] = useState(initialMode);
  const [text, setText] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const bundlesTitle = mode === 'default' ? null : mode === 'none' ? '' : text.trim();
    if (mode === 'custom' && !bundlesTitle) { toast.error(t('err_title')); return; }
    setSaving(true);
    try {
      await axios.patch(`${baseURL}/stores/${storeId}`, { design: { bundlesTitle } }, auth());
      toast.success(t('saved'));
      onSaved(bundlesTitle);
    } catch (e) {
      toast.error(errMsg(e, t('save_failed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 space-y-3 bg-white dark:bg-zinc-900">
      <p className="text-sm font-black text-gray-900 dark:text-white">{t('slider_title')}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('slider_title')}>
        {['default', 'custom', 'none'].map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={`px-3 h-9 rounded-xl text-xs font-bold border ${mode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
            {t(`title_${m}`)}
          </button>
        ))}
      </div>
      {mode === 'custom' && <input value={text} onChange={(e) => setText(e.target.value)} maxLength={60} placeholder={t('title_ph')} className={input} />}
      <button type="button" onClick={save} disabled={saving} className="h-10 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold disabled:opacity-60 flex items-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}{t('save')}
      </button>
    </div>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <article key={b.id} className={`rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden flex flex-col ${b.isActive ? 'border-gray-200 dark:border-zinc-800' : 'border-dashed border-gray-300 dark:border-zinc-700 opacity-75'}`}>
              <div className="relative bg-gray-100 dark:bg-zinc-800" style={{ aspectRatio: '16 / 8' }}>
                {b.imageUrl || b.mobileImageUrl ? <img src={b.imageUrl || b.mobileImageUrl} alt="" className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-gray-300"><ImagePlus className="w-8 h-8" /></span>}
                <span className="absolute top-2 start-2 px-2.5 py-0.5 rounded-full bg-red-700 text-white text-xs font-bold">-{b.discountPercent}%</span>
                <div className="absolute top-2 end-2 flex gap-1">
                  {!b.showOnHome && <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center gap-1"><EyeOff className="w-3 h-3" />{t('not_on_home')}</span>}
                  {!b.available && <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{t('unavailable')}</span>}
                </div>
              </div>
              <div className="p-3 space-y-2 flex-1">
                <h3 className="font-black text-gray-900 dark:text-white truncate">{b.name}</h3>
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {b.items.slice(0, 6).map((it) => (
                    it.imageUrl
                      ? <img key={it.productId} src={it.imageUrl} alt={it.name} title={it.name} className="w-9 h-9 rounded-lg object-cover border-2 border-white dark:border-zinc-900" />
                      : <span key={it.productId} title={it.name} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900" />
                  ))}
                </div>
                <div className="flex items-baseline gap-2 text-sm">
                  <s className="text-gray-400">{money(b.original)}</s>
                  <b className="text-indigo-600 dark:text-indigo-400">{money(b.price)}</b>
                  <span className="text-xs text-emerald-600 font-bold">{t('save_short')} {money(b.saving)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 p-2 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 me-auto">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-600 dark:text-zinc-300">
                    <input type="checkbox" checked={b.isActive} onChange={() => toggle(b)} className="w-4 h-4 accent-indigo-600" />{t('active')}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-600 dark:text-zinc-300">
                    <input type="checkbox" checked={b.showOnHome} onChange={() => toggle(b, 'showOnHome')} className="w-4 h-4 accent-indigo-600" />{t('on_home')}
                  </label>
                </div>
                {linkOf(b) && <a href={linkOf(b)} target="_blank" rel="noreferrer" aria-label={t('open')} className="p-2 rounded-lg text-gray-500"><ExternalLink className="w-4 h-4" /></a>}
                {linkOf(b) && <button type="button" onClick={() => copy(b)} aria-label={t('copy_link')} className="p-2 rounded-lg text-gray-500"><Copy className="w-4 h-4" /></button>}
                <button type="button" onClick={() => setEditing(b)} aria-label={t('edit')} className="p-2 rounded-lg text-gray-500"><Pencil className="w-4 h-4" /></button>
                <button type="button" onClick={() => remove(b)} aria-label={t('delete')} className="p-2 rounded-lg text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {store && <SliderTitle key={String(store?.design?.bundlesTitle)} storeId={storeId} value={store?.design?.bundlesTitle}
        onSaved={(v) => setStore((s) => ({ ...s, design: { ...(s?.design || {}), bundlesTitle: v } }))} />}

      {editing && (
        <BundleEditor storeId={storeId} bundle={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}
