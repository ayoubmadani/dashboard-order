import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2, Palette, LayoutGrid,
  ExternalLink, Download, CheckCircle2,
  ChevronLeft, ChevronRight, Crown,
} from 'lucide-react';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import Loading from '../../../components/Loading';

const DEFAULT_IMAGE = 'https://bloomidea.com/sites/default/files/styles/og_image/public/blog/Tipos%20de%20come%CC%81rcio%20electro%CC%81nico_0.png?itok=jC9MlQZq';
const ITEMS_PER_PAGE = 100;

function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─────────────────────────────────────────────
//  ThemeCard — my themes / default
// ─────────────────────────────────────────────
function ThemeCard({ image, name, isActivating, onActivate, isActive }) {
  const { t } = useTranslation('translation', { keyPrefix: 'theme' });

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
      isActive
        ? 'border-emerald-500 shadow-lg shadow-emerald-500/15'
        : 'border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'
    }`}>
      <div className="h-32 bg-gray-100 dark:bg-zinc-800 overflow-hidden">
        <img src={image || DEFAULT_IMAGE} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-3 bg-white dark:bg-zinc-900">
        <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">{name}</span>
        <button
          onClick={onActivate}
          disabled={isActive || isActivating}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
            isActive
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80'
          } disabled:opacity-60`}
        >
          {isActivating ? <Loader2 size={11} className="animate-spin" /> : isActive ? <CheckCircle2 size={11} /> : null}
          {isActivating ? '' : isActive ? t('my_themes.activated') : t('my_themes.activate_btn')}
        </button>
      </div>
      {isActive && (
        <div className="absolute top-2.5 start-2.5">
          <span className="flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
            <CheckCircle2 size={9} /> {t('my_themes.activated')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ThemeCardPlan — subscription themes
// ─────────────────────────────────────────────
function ThemeCardPlan({ image, name, isActivating, onActivate, isActive }) {
  const { t } = useTranslation('translation', { keyPrefix: 'theme' });

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
      isActive
        ? 'border-blue-500 shadow-lg shadow-blue-500/15'
        : 'border-gray-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-600'
    }`}>
      <div className="h-32 bg-gray-100 dark:bg-zinc-800 overflow-hidden">
        <img src={image || DEFAULT_IMAGE} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className={`flex items-center justify-between gap-2 px-3 py-3 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-zinc-900'}`}>
        <span className={`text-xs font-bold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-zinc-200'}`}>
          {name}
        </span>
        <button
          onClick={onActivate}
          disabled={isActive || isActivating}
          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
            isActive
              ? 'bg-blue-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
          } disabled:opacity-60`}
        >
          {isActivating ? <Loader2 size={11} className="animate-spin" /> : null}
          {isActivating ? '' : isActive ? t('my_themes.activated') : t('my_themes.activate_btn')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  FilterPill
// ─────────────────────────────────────────────
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        active
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow'
          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
//  Pagination
// ─────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange, isRtl }) {
  const { t } = useTranslation('translation', { keyPrefix: 'theme' });

  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft  : ChevronRight;
  return (
    <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
      >
        <Prev size={16} className="text-gray-600 dark:text-zinc-400" />
      </button>
      <span className="text-xs font-bold text-gray-600 dark:text-zinc-400">
        {t('gallery.page_info', { current: currentPage, total: totalPages })}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
      >
        <Next size={16} className="text-gray-600 dark:text-zinc-400" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Gallery Card
// ─────────────────────────────────────────────
function GalleryCard({ item, isInstalled, isIncludedInPlan, installingId, onInstall }) {
  const { t } = useTranslation('translation', { keyPrefix: 'theme' });

  return (
    <div className="group bg-gray-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-0.5 transition-all">
      <div className="relative h-44 bg-gray-100 dark:bg-zinc-800 overflow-hidden">
        <img
          src={item.imageUrl || DEFAULT_IMAGE}
          alt={item.name_en}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 end-3 flex flex-col gap-1.5 items-end">
          {isIncludedInPlan && (
            <span className="flex items-center gap-1 bg-indigo-600 text-white px-2.5 py-1 rounded-full text-[9px] font-black shadow-lg">
              <Crown size={9} />{t('gallery.plan_included_label')}
            </span>
          )}
          {isInstalled && (
            <span className="flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black shadow-lg">
              <CheckCircle2 size={9} />{t('gallery.installed_label')}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-black text-sm text-gray-900 dark:text-white">{item.name_en}</h3>
          {item.desc_en && (
            <p className="text-xs text-gray-400 dark:text-zinc-500 line-clamp-2 mt-1">{item.desc_en}</p>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href={`${storeURL}/show/${item.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
          >
            <ExternalLink size={13} />{t('gallery.preview_btn')}
          </a>
          <button
            onClick={() => onInstall(item.id)}
            disabled={installingId === item.id || isInstalled}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              isInstalled
                ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 shadow-sm'
            } disabled:opacity-60`}
          >
            {installingId === item.id
              ? <Loader2 size={13} className="animate-spin" />
              : isInstalled ? <CheckCircle2 size={13} /> : <Download size={13} />}
            {isInstalled ? t('gallery.installed_label') : t('gallery.install_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function Theme() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'theme' });

  const isRtl   = i18n.dir() === 'rtl';
  const headers = useAuthHeaders();
  const storeId = localStorage.getItem('storeId');

  const [themes,       setThemes]       = useState([]);
  const [myTheme,      setMyTheme]      = useState([]);
  const [planTheme,    setPlanTheme]    = useState([]);
  const [types,        setTypes]        = useState([]);
  const [planInfo,     setPlanInfo]     = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [loading,      setLoading]      = useState(true);
  const [installingId, setInstallingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [idActive,     setIdActive]     = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [activeTab,    setActiveTab]    = useState('my');

  /* ── Initial fetch ── */
  const getInitialData = async () => {
    try {
      const [typesRes, myThemeRes, planThemeRes, storeRes, planRes] = await Promise.all([
        axios.get(`${baseURL}/theme/type`),
        axios.get(`${baseURL}/theme/my`, headers),
        axios.get(`${baseURL}/theme/plan-sub`, headers),
        axios.get(`${baseURL}/stores/${storeId}`, headers),
        axios.get(`${baseURL}/theme/plan-info`, headers),
      ]);
      setTypes(typesRes.data ?? []);
      setMyTheme(myThemeRes.data ?? []);
      setPlanTheme(planThemeRes.data ?? []);
      setIdActive(storeRes.data?.data?.themeId ?? '');
      setPlanInfo(planRes.data ?? null);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => { getInitialData(); }, []);

  /* ── Filtered gallery ── */
  useEffect(() => {
    const fetchFilteredThemes = async () => {
      setLoading(true);
      try {
        const typeQuery = selectedType === 'all' ? '' : selectedType;
        const { data } = await axios.get(`${baseURL}/theme?type=${typeQuery}`, headers);
        setThemes(data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFilteredThemes();
  }, [selectedType]);

  /* ── Handlers ── */
  const handleActiveTheme = async (themeId) => {
    if (!storeId) { alert(t('alerts.no_store')); return; }
    setActivatingId(themeId ?? 'default');
    try {
      const res = await axios.post(`${baseURL}/theme/active-theme`, { themeId, storeId }, headers);
      if (res.data.success) { setIdActive(themeId); }
    } catch { alert(t('alerts.activate_error')); }
    finally { setActivatingId(null); }
  };

  const handleActiveThemePlan = async (themeId) => {
    if (!storeId) { alert(t('alerts.no_store')); return; }
    setActivatingId(themeId ?? 'default');
    try {
      const res = await axios.post(`${baseURL}/theme/active-theme-plan`, { themeId, storeId }, headers);
      if (res.status === 200 || res.status === 201) { setIdActive(themeId); }
    } catch (err) {
      alert(err.response?.data?.message || t('alerts.activate_error'));
    } finally { setActivatingId(null); }
  };

  const handleInstallTheme = async (themeId) => {
    if (!themeId) return;
    setInstallingId(themeId);
    try {
      const { data } = await axios.post(`${baseURL}/theme/install-theme/${themeId}`, {}, headers);
      if (data.success === false) { alert(t('alerts.install_error', { message: data.message })); return; }
      alert(t('alerts.install_success'));
      getInitialData();
    } catch (err) { console.error(err); }
    finally { setInstallingId(null); }
  };

  const totalPages      = Math.ceil(themes.length / ITEMS_PER_PAGE);
  const paginatedThemes = themes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const planThemeIds    = planInfo?.planThemeIds ?? [];

  const tabs = [
    { id: 'my',      label: t('my_themes.title'),     icon: Palette },
    ...(planTheme.length > 0 ? [{ id: 'plan', label: t('subscription.title'), icon: Crown }] : []),
    { id: 'gallery', label: t('gallery.title'),        icon: LayoutGrid },
  ];

  if (loading && themes.length === 0 && types.length === 0) return <Loading />;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-5 font-sans animate-in fade-in duration-500">

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: My Themes ── */}
      {activeTab === 'my' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <ThemeCard
              image={DEFAULT_IMAGE}
              name={t('my_themes.default_name')}
              isActivating={activatingId === 'default'}
              isActive={!idActive}
              onActivate={() => handleActiveTheme(null)}
            />
            {myTheme.map(item => (
              <ThemeCard
                key={item.id}
                image={item.imageUrl}
                name={item.name_en}
                isActivating={activatingId === item.id}
                isActive={idActive === item.id}
                onActivate={() => handleActiveTheme(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Plan Themes ── */}
      {activeTab === 'plan' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
          <div className="p-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {planTheme.map(item => (
                <ThemeCardPlan
                  key={item.id}
                  image={item.imageUrl}
                  name={item.name_en}
                  isActivating={activatingId === item.id}
                  isActive={idActive === item.id}
                  onActivate={() => handleActiveThemePlan(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Gallery ── */}
      {activeTab === 'gallery' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-6 space-y-5">
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label={t('types.all')}
              active={selectedType === 'all'}
              onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
            />
            {types.map(type => (
              <FilterPill
                key={type.id}
                label={type.name}
                active={selectedType === type.id}
                onClick={() => { setSelectedType(type.id); setCurrentPage(1); }}
              />
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-gray-300 dark:text-zinc-600" />
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-zinc-600 text-sm font-medium">
              {t('gallery.empty_title')}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedThemes.map(item => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    isInstalled={myTheme.some(m => m.id === item.id)}
                    isIncludedInPlan={planThemeIds.includes(item.id)}
                    installingId={installingId}
                    onInstall={handleInstallTheme}
                  />
                ))}
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
        </div>
      )}
    </div>
  );
}
