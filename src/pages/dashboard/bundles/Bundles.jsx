// الأطقم (باندل): القائمة — الإنشاء والتعديل في صفحة مستقلة (BundleEdit.jsx).
// تظهر في سلايدر «عروض الأطقم» بالرئيسية ولكل طقم صفحة طلب.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  Gift, Plus, Pencil, Trash2, Copy, ExternalLink, Loader2, ImagePlus, AlertTriangle,
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import NoStoreState from '../../../components/NoStoreState';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} DA`;
const errMsg = (e, fallback) => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || fallback;
};

const input = 'w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30';
const label = 'block text-xs font-bold text-gray-600 dark:text-zinc-300 mb-1.5';

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
  const navigate = useNavigate();
  const location = useLocation();

  // رجوع من صفحة الإنشاء/التعديل بعد الحفظ: رسالة ثم مسح الحالة (لا تتكرر عند التحديث)
  useEffect(() => {
    if (!location.state?.saved) return;
    toast.success(t('saved'));
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, t]);
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
        <Link to="/dashboard/bundles/new" className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('new')}
        </Link>
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
          <Link to="/dashboard/bundles/new" className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-bold inline-flex items-center gap-2"><Plus className="w-4 h-4" />{t('new')}</Link>
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
                  <Link to={`/dashboard/bundles/${b.id}`} aria-label={t('edit')} title={t('edit')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><Pencil className="w-4 h-4" /></Link>
                  <button type="button" onClick={() => remove(b)} aria-label={t('delete')} title={t('delete')} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
