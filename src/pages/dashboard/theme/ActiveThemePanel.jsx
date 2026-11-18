// إطار الثيم المفعّل فوق التبويبات: ألوان المتجر (إن كان الثيم يتبعها) + ملاحظات ليظهر الثيم جيداً
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Lightbulb, Palette, Sparkles } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { PRESET_COLORS, themeColorSupport, themeNotes } from '../../../utils/themePanel';

// كود الثيم المنشور (نفس الملف الذي يحمّله المتجر) — لمعرفة هل يتبع ألوان المتجر
const THEMES_ORIGIN = import.meta.env.VITE_THEMES_ORIGIN || 'https://mdstore.top';
const HEX = /^#[0-9a-f]{6}$/i;

function ColorRow({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} aria-label={c} title={c}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${value?.toLowerCase() === c.toLowerCase() ? 'border-gray-900 dark:border-white scale-110' : 'border-white/0 ring-1 ring-black/10 dark:ring-white/10'}`}
            style={{ background: c }} />
        ))}
        <label className="relative w-7 h-7 rounded-full grid place-items-center ring-1 ring-black/10 dark:ring-white/15 cursor-pointer bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" title="custom">
          <input type="color" value={HEX.test(value || '') ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <span dir="ltr" className="text-xs font-mono text-gray-500">{value}</span>
      </div>
    </div>
  );
}

export default function ActiveThemePanel({ theme, themeName, store, storeId, headers, onStoreChange }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'theme' });
  const [support, setSupport] = useState({ primary: false, secondary: false });
  const [primary, setPrimary] = useState(store?.design?.primaryColor || '#4F46E5');
  const [secondary, setSecondary] = useState(store?.design?.secondaryColor || '#F59E0B');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    setPrimary(store?.design?.primaryColor || '#4F46E5');
    setSecondary(store?.design?.secondaryColor || '#F59E0B');
  }, [store?.design?.primaryColor, store?.design?.secondaryColor]);

  // هل يتبع الثيم ألوان المتجر؟ (من كوده)
  useEffect(() => {
    let alive = true;
    if (!theme?.slug) return undefined;
    fetch(`${THEMES_ORIGIN}/api/themes/${theme.slug}`)
      .then((r) => (r.ok ? r.text() : ''))
      .then((code) => { if (alive) setSupport(themeColorSupport(code)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [theme?.slug]);

  // ملاحظات من حالة المتجر
  useEffect(() => {
    let alive = true;
    if (!storeId) return undefined;
    Promise.all([
      axios.get(`${baseURL}/stores/${storeId}/products?page=1&limit=100`, headers).catch(() => ({ data: {} })),
      axios.get(`${baseURL}/stores/${storeId}/categories`, headers).catch(() => ({ data: [] })),
      // ملاحظات الأدمن لهذا الثيم (جدول theme_notes)
      theme?.id ? axios.get(`${baseURL}/theme/${theme.id}/notes`, headers).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([p, c, tn]) => {
      if (!alive) return;
      setNotes(themeNotes({
        store,
        products: p.data?.products || [],
        productsTotal: p.data?.total ?? (p.data?.products || []).length,
        categories: Array.isArray(c.data) ? c.data : [],
        adminNotes: Array.isArray(tn.data) ? tn.data : [],
        lang: i18n.language,
      }));
    });
    return () => { alive = false; };
  }, [storeId, store, theme?.id, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = primary !== (store?.design?.primaryColor || '#4F46E5') || (support.secondary && secondary !== (store?.design?.secondaryColor || '#F59E0B'));

  const saveColors = async () => {
    setSaving(true);
    try {
      const design = { primaryColor: primary, ...(support.secondary ? { secondaryColor: secondary } : {}) };
      await axios.patch(`${baseURL}/stores/${storeId}`, { design }, headers);
      onStoreChange?.({ ...store, design: { ...(store?.design || {}), ...design } });
      toast.success(t('panel.colors_saved'));
    } catch {
      toast.error(t('panel.colors_error'));
    } finally { setSaving(false); }
  };

  const link = { logo: `/dashboard/settings/stores/edit/${storeId}`, hero: `/dashboard/settings/stores/edit/${storeId}`, products: '/dashboard/products', categories: '/dashboard/categories' };

  return (
    <section className="rounded-2xl border border-indigo-200/70 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-500/5 dark:to-zinc-900 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-black text-gray-900 dark:text-white">{themeName}</h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{t('panel.active')}</span>
      </div>

      {/* الألوان: فقط إن كان الثيم يتبعها */}
      {support.primary ? (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-gray-700 dark:text-gray-200"><Palette className="w-3.5 h-3.5" /> {t('panel.colors_title')}</p>
          <ColorRow label={t('panel.primary')} value={primary} onChange={setPrimary} />
          {support.secondary && <ColorRow label={t('panel.secondary')} value={secondary} onChange={setSecondary} />}
          <div className="flex flex-wrap items-center gap-3">
            {/* معاينة فورية */}
            <span className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ background: primary }}>{t('panel.preview_button')}</span>
            <span className="text-sm font-black" style={{ color: primary }}>2,500 DZD</span>
            {support.secondary && <span className="px-2.5 py-1 rounded-full text-white text-[11px] font-bold" style={{ background: secondary }}>{t('panel.preview_badge')}</span>}
            <button type="button" onClick={saveColors} disabled={!dirty || saving}
              className="ms-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold disabled:opacity-40">
              {saving ? '…' : t('panel.save')}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> {t('panel.fixed_colors')}</p>
      )}

      {/* ملاحظات ليظهر الثيم جيداً */}
      {notes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-black text-gray-700 dark:text-gray-200">{t('panel.notes_title')}</p>
          {notes.map((n) => n.key === 'tip' ? (
            <p key={`tip-${n.text}`} className="flex items-start gap-2 text-xs text-indigo-700 dark:text-indigo-300"><Lightbulb className="w-4 h-4 shrink-0" /> {n.text}</p>
          ) : (
            <div key={n.key} className="flex items-center gap-2 text-xs">
              {n.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
              <span className={n.ok ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200 font-semibold'}>
                {t(`panel.note_${n.key}_${n.ok ? 'ok' : n.empty ? 'empty' : 'missing'}`, { count: n.count })}
              </span>
              {!n.ok && <Link to={link[n.key]} className="ms-auto text-indigo-600 dark:text-indigo-400 font-bold hover:underline">{t('panel.fix')}</Link>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
