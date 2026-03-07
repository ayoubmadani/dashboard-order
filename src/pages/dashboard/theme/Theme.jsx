import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2, Palette, Layers, LayoutGrid,
  ExternalLink, Download, CheckCircle2, Sparkles
} from 'lucide-react';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const DEFAULT_IMAGE = 'https://bloomidea.com/sites/default/files/styles/og_image/public/blog/Tipos%20de%20come%CC%81rcio%20electro%CC%81nico_0.png?itok=jC9MlQZq';

export default function Theme() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'theme' });
  const isRtl = i18n.dir() === 'rtl';

  const [themes, setThemes] = useState([]);
  const [myTheme, setMyTheme] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [idActive, setIdActive] = useState('');

  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  /* ── Fetch ── */
  async function getData() {
    setLoading(true);
    try {
      const [themesRes, typesRes, myThemeRes, store] = await Promise.all([
        axios.get(`${baseURL}/theme`),
        axios.get(`${baseURL}/theme/type`),
        axios.get(`${baseURL}/theme/my`, headers),
        axios.get(`${baseURL}/stores/${storeId}`, headers),
      ]);

      const themeUserData = store.data?.data?.themeUser; // الوصول لأول عنصر في المصفوفة      

      if (themeUserData?.themeId) {
        setIdActive(themeUserData.themeId)
      } else {
        setIdActive('')
      }

      setThemes(themesRes.data.data ?? []);
      setTypes(typesRes.data ?? []);
      setMyTheme(myThemeRes.data ?? []);
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { getData(); }, []);

  /* ── Filter ── */
  const filteredThemes =
    selectedType === 'all'
      ? themes
      : themes.filter(theme => theme.themeTypeId === selectedType);

  /* ── Handlers ── */
  const handleInstallTheme = async (themeId) => {
    if (!themeId) return;
    setInstallingId(themeId);
    try {
      const { data } = await axios.get(`${baseURL}/theme/install-theme/${themeId}`, headers);
      if (data.success === false) {
        alert(t('alerts.install_error', { message: data.message }));
        return;
      }
      alert(t('alerts.install_success'));
      getData();
    } catch (error) {
      console.error('Connection error:', error.message);
    } finally {
      setInstallingId(null);
    }
  };

  const handleActiveTheme = async (themeId) => {
    if (!storeId) { alert(t('alerts.no_store')); return; }
    setActivatingId(themeId ?? 'default');
    try {
      const res = await axios.post(
        `${baseURL}/theme/active-theme`,
        { themeId, storeId },
        headers
      );
      const data = res.data
      console.log(res);
      
      if (data.success) {
        setIdActive(themeId)
        getData();
      } else {
      }
    } catch (error) {
      console.error('Activation failed:', error);
      alert(t('alerts.activate_error'));
    } finally {
      setActivatingId(null);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-130px)] flex flex-col justify-center items-center gap-3 bg-gray-50 dark:bg-zinc-950" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <Loader2 size={28} className="text-indigo-500 animate-spin" />
        </div>
        <p className="text-sm text-gray-400 dark:text-zinc-500 font-medium">{t('loading')}</p>
      </div>
    );
  }

  /* ── Helpers ── */
  const resultsLabel = filteredThemes.length === 1
    ? t('gallery.results_one')
    : t('gallery.results_other', { count: filteredThemes.length });

  return (
    <div
      className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-6 md:p-8 space-y-6 font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >

      {/* ═══════════════════════════════
          My Themes
      ═══════════════════════════════ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">

        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
            <Palette size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('my_themes.title')}</h2>
        </div>

        <div className="flex flex-wrap gap-5">

          {/* Default slot */}
          <ThemeCard
            image={DEFAULT_IMAGE}
            name={t('my_themes.default_name')}
            isActivating={activatingId === 'default'}
            onActivate={() => handleActiveTheme()}
            activateLabel={t('my_themes.activate_btn')}
            isDefault
            isActive={idActive === ""}
          />

          {/* Installed themes */}
          {myTheme.map((item) => (
            <ThemeCard
              key={item.id}
              image={item.imageUrl}
              name={item.name_en}
              isActivating={activatingId === item.id}
              isActive={idActive === item.id}
              onActivate={() => handleActiveTheme(item.id)}
              activateLabel={t('my_themes.activate_btn')}
            />
          ))}

          {myTheme.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-4">{t('my_themes.empty')}</p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════
          Type Filter
      ═══════════════════════════════ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
            <Layers size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('types.title')}</h2>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* All pill */}
          <FilterPill
            label={t('types.all')}
            active={selectedType === 'all'}
            onClick={() => setSelectedType('all')}
          />
          {/* Dynamic pills */}
          {types.map((type) => (
            <FilterPill
              key={type.id}
              label={type.name}
              active={selectedType === type.id}
              onClick={() => setSelectedType(type.id)}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════
          Theme Gallery
      ═══════════════════════════════ */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
              <LayoutGrid size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('gallery.title')}</h2>
          </div>
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            {resultsLabel}
          </span>
        </div>

        {filteredThemes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid size={24} className="text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-500 dark:text-zinc-400">{t('gallery.empty_title')}</p>
            <p className="text-sm mt-1">{t('gallery.empty_subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredThemes.map((item) => {
              const isFree = Number(item.price) === 0;
              const isInstalling = installingId === item.id;

              return (
                <div
                  key={item.id}
                  className="group bg-gray-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-xl transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name_en}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles size={40} className="text-gray-300 dark:text-zinc-600" />
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Price badge */}
                    <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 dark:text-white shadow-sm`}>
                      {isFree ? t('gallery.free_label') : `$${Number(item.price).toFixed(2)}`}
                    </div>

                    {/* Free pill */}
                    {isFree && (
                      <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wide`}>
                        {t('gallery.free_label')}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {item.name_en || item.name_ar}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 line-clamp-2">
                      {item.desc_en}
                    </p>

                    {/* Tags */}
                    {Array.isArray(item.tag) && item.tag.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tag.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400 text-[10px] font-semibold rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2.5">
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`${storeURL}/show/${item.slug}`}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-500/20"
                      >
                        <ExternalLink size={14} />
                        {t('gallery.preview_btn')}
                      </a>
                      <button
                        onClick={() => handleInstallTheme(item.id)}
                        disabled={isInstalling}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm"
                      >
                        {isInstalling
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Download size={14} />}
                        {t('gallery.install_btn')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Sub-components ── */



function ThemeCard({ image, name, isActivating, onActivate, activateLabel, isDefault, isActive = false }) {
  return (
    <div className={`flex flex-col items-center gap-2.5 group p-2 rounded-2xl transition-all duration-300
      ${isActive
        ? "border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
        : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900"}
    `}>

      {/* Container للصورة */}
      <div className={`w-28 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-200 
        ${isActive
          ? 'border-emerald-500'
          : isDefault
            ? 'border-emerald-200 dark:border-emerald-500/30' // تم التغيير للأخضر
            : 'border-gray-200 dark:border-zinc-700'} 
        group-hover:border-emerald-400 dark:group-hover:border-emerald-500/60 shadow-sm`}
      >
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* اسم القالب */}
      <span className={`text-xs font-bold text-center max-w-[7rem] truncate transition-colors
        ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-600 dark:text-zinc-400"}
      `}>
        {name}
      </span>

      {/* زر التفعيل */}
      <button
        onClick={onActivate}
        disabled={isActivating || isActive}
        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-70
          ${isActive
            ? "bg-emerald-500 text-white cursor-default"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"} // تم التغيير للأخضر
        `}
      >
        {isActivating ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <CheckCircle2 size={12} />
        )}
        {isActive ? "مفعّل" : activateLabel}
      </button>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
    >
      {label}
    </button>
  );
}