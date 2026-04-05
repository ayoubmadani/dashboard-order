import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2, Palette, Layers, LayoutGrid,
  ExternalLink, Download, CheckCircle2, Sparkles,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import Loading from '../../../components/Loading';

// 1. الثوابت الأساسية
const DEFAULT_IMAGE = 'https://bloomidea.com/sites/default/files/styles/og_image/public/blog/Tipos%20de%20come%CC%81rcio%20electro%CC%81nico_0.png?itok=jC9MlQZq';
const ITEMS_PER_PAGE = 6;

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
  const [currentPage, setCurrentPage] = useState(1);

  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // جلب البيانات الأولية (التصنيفات، ثيماتي، بيانات المتجر)
  async function getInitialData() {
    try {
      const [typesRes, myThemeRes, store] = await Promise.all([
        axios.get(`${baseURL}/theme/type`),
        axios.get(`${baseURL}/theme/my`, headers),
        axios.get(`${baseURL}/stores/${storeId}`, headers),
      ]);

      setTypes(typesRes.data ?? []);
      setMyTheme(myThemeRes.data ?? []);
      const themeUserData = store.data?.data?.themeUser;
      setIdActive(themeUserData?.themeId ?? '');
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }

  useEffect(() => { getInitialData(); }, []);

  // 2. الفلترة عبر Axios (تحديث قائمة الثيمات بناءً على النوع)
  useEffect(() => {
    const fetchFilteredThemes = async () => {
      setLoading(true);
      try {
        const typeQuery = (selectedType === 'all' || !selectedType) ? '' : selectedType;
        const { data } = await axios.get(`${baseURL}/theme?type=${typeQuery}`, headers);
        setThemes(data.data ?? []);
      } catch (err) {
        console.error('Error fetching filtered themes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredThemes();
  }, [selectedType]);

  /* ── منطق Pagination ── */
  const totalPages = Math.ceil(themes.length / ITEMS_PER_PAGE);
  const paginatedThemes = themes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTypeChange = (typeId) => {
    setSelectedType(typeId);
    setCurrentPage(1);
  };

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
      getInitialData(); // لتحديث قسم "ثيماتي"
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
      if (res.data.success) {
        setIdActive(themeId);
        alert(t('alerts.activate_success'));
      }
    } catch (error) {
      console.error('Activation failed:', error);
      alert(t('alerts.activate_error'));
    } finally {
      setActivatingId(null);
    }
  };

  if (loading && themes.length === 0 && types.length === 0) return <Loading />;

  // تعريف التسمية لعدد النتائج لضمان عدم حدوث خطأ ReferenceError
  const resultsLabel = themes.length === 1
    ? t('gallery.results_one')
    : t('gallery.results_other', { count: themes.length });

  return (
    <div
      className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-6 md:p-8 space-y-6 font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* قسم ثيماتي (My Themes) */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
            <Palette size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('my_themes.title')}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <ThemeCard
            image={DEFAULT_IMAGE}
            name={t('my_themes.default_name')}
            isActivating={activatingId === 'default'}
            onActivate={() => handleActiveTheme(null)}
            activateLabel={t('my_themes.activate_btn')}
            isDefault
            isActive={idActive === '' || idActive === null}
          />
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
        </div>
      </section>

      {/* قسم الفلترة (Type Filter) */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
            <Layers size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('types.title')}</h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <FilterPill
            label={t('types.all')}
            active={selectedType === 'all'}
            onClick={() => handleTypeChange('all')}
          />
          {types.map((type) => (
            <FilterPill
              key={type.id}
              label={type.name}
              active={selectedType === type.id}
              onClick={() => handleTypeChange(type.id)}
            />
          ))}
        </div>
      </section>

      {/* معرض الثيمات (Theme Gallery) */}
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

        {themes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
             <LayoutGrid size={48} className="mx-auto mb-4 opacity-20" />
             <p>{t('gallery.empty_title')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginatedThemes.map((item) => {
                const isFree = Number(item.price) === 0;
                return (
                  <div key={item.id} className="group bg-gray-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 hover:shadow-xl transition-all">
                    <div className="relative h-48 bg-gray-100 dark:bg-zinc-800">
                      <img src={item.imageUrl || DEFAULT_IMAGE} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 px-3 py-1 rounded-full text-xs font-bold">
                        {isFree ? t('gallery.free_label') : `$${Number(item.price).toFixed(2)}`}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.name_en}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.desc_en}</p>
                      <div className="flex gap-2">
                        <a href={`${storeURL}/show/${item.slug}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-sm font-bold">
                          <ExternalLink size={14} /> {t('gallery.preview_btn')}
                        </a>
                        <button 
                          onClick={() => handleInstallTheme(item.id)}
                          disabled={installingId === item.id}
                          className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold"
                        >
                          {installingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          {t('gallery.install_btn')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isRtl={isRtl}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ThemeCard — horizontal card design
═══════════════════════════════════════════════════ */
function ThemeCard({ image, name, isActivating, onActivate, activateLabel, isDefault, isActive = false }) {
  return (
    <div
      className={`relative flex-shrink-0 w-56 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group
        ${isActive
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
          : 'border-gray-200 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-md'
        }`}
    >
      {/* Cover image */}
      <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-zinc-800">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={e => { e.target.style.display = 'none'; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Active badge top-right */}
        {isActive && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={10} />
            مفعّل
          </div>
        )}

        {/* Default badge */}
        {isDefault && !isActive && (
          <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">
            Default
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div
        className={`px-3 py-3 flex items-center justify-between gap-2
          ${isActive
            ? 'bg-emerald-50 dark:bg-emerald-500/10'
            : 'bg-white dark:bg-zinc-900'
          }`}
      >
        <span
          className={`text-xs font-bold truncate max-w-[7rem]
            ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-zinc-300'}`}
        >
          {name}
        </span>

        <button
          onClick={onActivate}
          disabled={isActivating || isActive}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-70
            ${isActive
              ? 'bg-emerald-500 text-white cursor-default'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/30'
            }`}
        >
          {isActivating
            ? <Loader2 size={11} className="animate-spin" />
            : isActive
              ? <CheckCircle2 size={11} />
              : <Zap size={11} />
          }
          {isActive ? 'مفعّل' : activateLabel}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FilterPill
═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   Pagination
═══════════════════════════════════════════════════ */
function Pagination({ currentPage, totalPages, onPageChange, isRtl }) {
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  /* Build page numbers: always show first, last, current ±1, with ellipsis */
  const getPages = () => {
    const pages = [];
    const range = (from, to) => {
      for (let i = from; i <= to; i++) pages.push(i);
    };

    if (totalPages <= 7) {
      range(1, totalPages);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('…');
      range(Math.max(2, currentPage - 1), Math.min(totalPages - 1, currentPage + 1));
      if (currentPage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <PrevIcon size={16} />
      </button>

      {/* Pages */}
      {getPages().map((page, idx) =>
        page === '…' ? (
          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-zinc-500 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200
              ${currentPage === page
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                : 'border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <NextIcon size={16} />
      </button>
    </div>
  );
}