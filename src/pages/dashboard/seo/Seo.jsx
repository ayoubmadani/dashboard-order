import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Search, Loader2, Save, Share2, ShieldCheck, Globe, ImagePlus, X, CheckCircle2 } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import NoStoreState from '../../../components/NoStoreState';
import ModelImages from '../../../components/ModelImages';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const errMsg = (err, fallback) => {
  const m = err?.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

const EMPTY = { metaTitle: '', metaDescription: '', keywords: '', ogImageUrl: '', googleVerification: '', bingVerification: '', allowIndexing: true };
const LIMITS = { metaTitle: 70, metaDescription: 170, keywords: 300 };
// النطاق المثالي لكل حقل (أخضر داخله، برتقالي خارجه)
const IDEAL = { metaTitle: [30, 60], metaDescription: [70, 160] };

// إعدادات SEO للمتجر: عنوان ووصف Google، صورة المشاركة، رموز التحقق، والفهرسة
export default function Seo() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'seo' });
  const isRtl = i18n.dir() === 'rtl';
  const storeId = localStorage.getItem('storeId');

  const [form, setForm] = useState(EMPTY);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [imageModal, setImageModal] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    Promise.all([
      axios.get(`${baseURL}/stores/${storeId}/seo`, auth()),
      axios.get(`${baseURL}/stores/${storeId}`, auth()).catch(() => null),
    ])
      .then(([seo, s]) => {
        const d = seo.data || {};
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d[k] ?? EMPTY[k]])));
        setStore(s?.data?.data ?? s?.data ?? null);
      })
      .catch((err) => setMessage({ type: 'error', text: errMsg(err, t('load_error')) }))
      .finally(() => setLoading(false));
  }, [storeId, t]);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await axios.put(`${baseURL}/stores/${storeId}/seo`, form, auth());
      setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? EMPTY[k]])));
      setMessage({ type: 'success', text: t('saved') });
    } catch (err) {
      setMessage({ type: 'error', text: errMsg(err, t('save_error')) });
    } finally {
      setSaving(false);
    }
  };

  if (!storeId) return <NoStoreState title={t('no_store')} subtitle="" cta="" isRtl={isRtl} />;

  const storeName = store?.name || '';
  const domain = store?.domains?.find((d) => d.scope !== 'landing_page')?.domain || (store?.subdomain ? `${store.subdomain}.mdstore.top` : 'mdstore.top');
  const previewTitle = form.metaTitle || storeName;
  const previewDesc = form.metaDescription || store?.hero?.subtitle || storeName;
  const previewImage = form.ogImageUrl || store?.hero?.imageUrl || store?.design?.logoUrl;

  const card = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4';
  const input = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white';
  const label = 'block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1.5';
  const hint = 'text-xs text-gray-400 mt-1';

  const Counter = ({ field }) => {
    const n = (form[field] || '').length;
    const [lo, hi] = IDEAL[field] || [0, LIMITS[field]];
    const ok = n === 0 || (n >= lo && n <= hi);
    return <span className={`text-xs font-semibold ${ok ? 'text-gray-400' : 'text-amber-600'}`}>{t('chars', { count: n, max: LIMITS[field] })}</span>;
  };

  const SectionTitle = ({ icon, children }) => (
    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
      {React.createElement(icon, { size: 17, className: 'text-indigo-600' })} {children}
    </p>
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><Search size={22} /></span>
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          {/* ── نتائج البحث ── */}
          <section className={card}>
            <SectionTitle icon={Search}>{t('section_search')}</SectionTitle>

            <div>
              <div className="flex items-center justify-between"><label className={label}>{t('meta_title')}</label><Counter field="metaTitle" /></div>
              <input value={form.metaTitle} onChange={set('metaTitle')} maxLength={LIMITS.metaTitle} placeholder={t('meta_title_ph')} className={input} />
              <p className={hint}>{t('meta_title_hint')}</p>
            </div>

            <div>
              <div className="flex items-center justify-between"><label className={label}>{t('meta_description')}</label><Counter field="metaDescription" /></div>
              <textarea value={form.metaDescription} onChange={set('metaDescription')} maxLength={LIMITS.metaDescription} rows={3} placeholder={t('meta_description_ph')} className={`${input} resize-none`} />
              <p className={hint}>{t('meta_description_hint')}</p>
            </div>

            <div>
              <div className="flex items-center justify-between"><label className={label}>{t('keywords')}</label><Counter field="keywords" /></div>
              <input value={form.keywords} onChange={set('keywords')} maxLength={LIMITS.keywords} placeholder={t('keywords_ph')} className={input} />
              <p className={hint}>{t('keywords_hint')}</p>
            </div>

            {/* معاينة Google */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/40 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{t('preview_google')}</p>
              <div dir="auto" className="space-y-1 min-w-0">
                <p className="text-xs text-gray-600 dark:text-zinc-400 truncate" dir="ltr">https://{domain}</p>
                <p className="text-[17px] leading-snug text-[#1a0dab] dark:text-indigo-300 truncate">{previewTitle || '—'}</p>
                <p className="text-[13px] leading-relaxed text-gray-600 dark:text-zinc-400 line-clamp-2">{previewDesc}</p>
              </div>
            </div>
          </section>

          {/* ── المشاركة ── */}
          <section className={card}>
            <SectionTitle icon={Share2}>{t('section_share')}</SectionTitle>
            <div>
              <label className={label}>{t('og_image')}</label>
              <div className="flex gap-2">
                <input value={form.ogImageUrl} onChange={set('ogImageUrl')} dir="ltr" placeholder={t('og_image_ph')} className={`${input} min-w-0`} />
                <button type="button" onClick={() => setImageModal(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <ImagePlus size={16} /> <span className="hidden sm:inline">{t('upload')}</span>
                </button>
                {form.ogImageUrl && (
                  <button type="button" onClick={() => set('ogImageUrl')('')} className="shrink-0 px-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-400 hover:text-rose-500"><X size={16} /></button>
                )}
              </div>
              <p className={hint}>{t('og_image_hint')}</p>
            </div>

            {/* معاينة المشاركة */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{t('preview_share')}</p>
              <div className="max-w-md rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <div className="aspect-[1200/630] bg-gray-200 dark:bg-zinc-700">
                  {previewImage && <img src={previewImage} alt="" className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div dir="auto" className="p-3 space-y-0.5 min-w-0">
                  <p className="text-[11px] uppercase text-gray-500 truncate" dir="ltr">{domain}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{previewTitle || '—'}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">{previewDesc}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── التحقق ── */}
          <section className={card}>
            <SectionTitle icon={ShieldCheck}>{t('section_verify')}</SectionTitle>
            <div>
              <label className={label}>{t('google_verification')}</label>
              <input value={form.googleVerification} onChange={set('googleVerification')} dir="ltr" className={`${input} font-mono`} />
              <p className={hint}>{t('google_verification_hint')}</p>
            </div>
            <div>
              <label className={label}>{t('bing_verification')}</label>
              <input value={form.bingVerification} onChange={set('bingVerification')} dir="ltr" className={`${input} font-mono`} />
              <p className={hint}>{t('bing_verification_hint')}</p>
            </div>
          </section>

          {/* ── الفهرسة ── */}
          <section className={card}>
            <SectionTitle icon={Globe}>{t('section_index')}</SectionTitle>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allowIndexing} onChange={set('allowIndexing')} className="mt-1 w-4 h-4 accent-indigo-600" />
              <span>
                <span className="block text-sm font-bold text-gray-800 dark:text-zinc-200">{t('allow_indexing')}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{t('allow_indexing_hint')}</span>
              </span>
            </label>
          </section>

          <div className="space-y-3">
            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {t('save')}
            </button>
            {message && (
              <p className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {message.type === 'success' && <CheckCircle2 size={16} />} {message.text}
              </p>
            )}
          </div>
        </form>
      )}

      <ModelImages
        isOpen={imageModal}
        close={() => setImageModal(false)}
        initialFolder="hero"
        maxSelectable={1}
        onSelectImage={(img) => { set('ogImageUrl')(img.url); setImageModal(false); }}
      />
    </div>
  );
}
