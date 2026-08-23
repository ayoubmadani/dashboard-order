import axios from 'axios';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'sonner';
import {
  Loader2, Palette, LayoutGrid,
  ExternalLink, Download, CheckCircle2,
  ChevronLeft, ChevronRight, Crown, X, Tag,
} from 'lucide-react';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import Loading from '../../../components/Loading';
import CouponInput from '../../../components/CouponInput';

const DEFAULT_IMAGE = 'https://bloomidea.com/sites/default/files/styles/og_image/public/blog/Tipos%20de%20come%CC%81rcio%20electro%CC%81nico_0.png?itok=jC9MlQZq';
const ITEMS_PER_PAGE = 100;

function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

function getLocalizedThemeText(item, field, lang) {
  if (!item) return '';
  const suffix = lang === 'ar' ? '_ar' : lang === 'fr' ? '_fr' : '_en';
  return item[`${field}${suffix}`] || item[`${field}_en`] || '';
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
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'theme' });
  const name = getLocalizedThemeText(item, 'name', i18n.language);
  const desc = getLocalizedThemeText(item, 'desc', i18n.language);
  const isFree = Number(item.price) === 0;

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      {/* Image with bottom gradient scrim — name & price live directly on the photo */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={item.imageUrl || DEFAULT_IMAGE}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

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

        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-2">
          <h3 className="font-black text-white text-base leading-tight drop-shadow-sm">{name}</h3>
          <span className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black backdrop-blur-sm ${
            isFree ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-gray-900'
          }`}>
            <Tag size={11} />
            {isFree ? t('gallery.free_label') : t('gallery.price_label', { price: Number(item.price).toLocaleString() })}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {desc && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">{desc}</p>
        )}

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
            onClick={() => onInstall(item)}
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
            {isInstalled ? t('gallery.installed_label') : isFree ? t('gallery.install_btn') : t('gallery.buy_btn')}
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

  const [installTarget,          setInstallTarget]          = useState(null);
  const [installCouponCode,      setInstallCouponCode]      = useState('');
  const [installCouponChecking,  setInstallCouponChecking]  = useState(false);
  const [installCouponInfo,      setInstallCouponInfo]      = useState(null);
  const [installCouponError,     setInstallCouponError]     = useState('');

  /* ── Initial fetch ── */
  const getInitialData = async () => {
    try {
      const [typesRes, myThemeRes, planThemeRes, storeRes, planRes] = await Promise.all([
        axios.get(`${baseURL}/theme/type`),
        axios.get(`${baseURL}/theme/my`, headers),
        axios.get(`${baseURL}/theme/plan-sub`, headers),
        storeId ? axios.get(`${baseURL}/stores/${storeId}`, headers) : Promise.resolve({ data: { data: null } }),
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
    if (!storeId) { toast.error(t('alerts.no_store')); return; }
    setActivatingId(themeId ?? 'default');
    try {
      const res = await axios.post(`${baseURL}/theme/active-theme`, { themeId, storeId }, headers);
      if (res.data.success) { setIdActive(themeId); toast.success(t('alerts.activate_success')); }
    } catch { toast.error(t('alerts.activate_error')); }
    finally { setActivatingId(null); }
  };

  const handleActiveThemePlan = async (themeId) => {
    if (!storeId) { toast.error(t('alerts.no_store')); return; }
    setActivatingId(themeId ?? 'default');
    try {
      const res = await axios.post(`${baseURL}/theme/active-theme-plan`, { themeId, storeId }, headers);
      if (res.status === 200 || res.status === 201) { setIdActive(themeId); toast.success(t('alerts.activate_success')); }
    } catch (err) {
      toast.error(err.response?.data?.message || t('alerts.activate_error'));
    } finally { setActivatingId(null); }
  };

  const handleInstallTheme = async (themeId, couponCode) => {
    if (!themeId) return;
    setInstallingId(themeId);
    try {
      const { data } = await axios.post(`${baseURL}/theme/install-theme/${themeId}`, { couponCode }, headers);
      if (data.success === false) { toast.error(t('alerts.install_error', { message: data.message })); return; }
      toast.success(t('alerts.install_success'));
      if (window.gtag && installTarget && Number(installTarget.price) > 0) {
        const finalPrice = installCouponInfo ? installCouponInfo.finalPrice : Number(installTarget.price);
        const themeName = getLocalizedThemeText(installTarget, 'name', i18n.language);
        window.gtag('event', 'purchase', {
          transaction_id: `theme-${themeId}-${Date.now()}`,
          value: finalPrice,
          currency: 'DZD',
          theme_id: themeId,
          theme_name: themeName,
          items: [{ item_id: themeId, item_name: themeName, item_category: 'theme' }],
        });
      }
      setInstallTarget(null);
      setInstallCouponCode(''); setInstallCouponInfo(null); setInstallCouponError('');
      getInitialData();
    } catch (err) { console.error(err); }
    finally { setInstallingId(null); }
  };

  const handleApplyInstallCoupon = async () => {
    if (!installCouponCode.trim() || !installTarget) return;
    setInstallCouponChecking(true); setInstallCouponError(''); setInstallCouponInfo(null);
    try {
      const { data } = await axios.post(`${baseURL}/coupons/validate`,
        { code: installCouponCode.trim(), scope: 'theme', basePrice: Number(installTarget.price) },
        headers);
      setInstallCouponInfo(data);
    } catch (err) {
      setInstallCouponError(err?.response?.data?.message || t('coupon.invalid'));
    } finally { setInstallCouponChecking(false); }
  };

  const handleClearInstallCoupon = () => {
    setInstallCouponCode(''); setInstallCouponInfo(null); setInstallCouponError('');
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
      <Toaster position="top-center" richColors />

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
                name={getLocalizedThemeText(item, 'name', i18n.language)}
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
                  name={getLocalizedThemeText(item, 'name', i18n.language)}
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
                    onInstall={(theme) => {
                      if (Number(theme.price) > 0) {
                        setInstallTarget(theme);
                        setInstallCouponCode(''); setInstallCouponInfo(null); setInstallCouponError('');
                      } else {
                        handleInstallTheme(theme.id);
                      }
                    }}
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

      {/* ── Install confirm modal (paid themes) ── */}
      {installTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setInstallTarget(null); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h2 className="font-black text-gray-900 dark:text-white text-base">{t('coupon.modal_title')}</h2>
              <button onClick={() => setInstallTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 pb-2">
              <p className="font-black text-sm text-gray-900 dark:text-white">{getLocalizedThemeText(installTarget, 'name', i18n.language)}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                {installCouponInfo
                  ? <>
                      <span className="line-through me-1.5">{Number(installTarget.price).toLocaleString()}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{installCouponInfo.finalPrice?.toLocaleString()} DZD</span>
                    </>
                  : <span className="font-bold text-gray-700 dark:text-zinc-300">{Number(installTarget.price).toLocaleString()} DZD</span>
                }
              </p>
            </div>
            <div className="px-6 py-4">
              <CouponInput
                code={installCouponCode}
                onCodeChange={setInstallCouponCode}
                onApply={handleApplyInstallCoupon}
                onClear={handleClearInstallCoupon}
                checking={installCouponChecking}
                error={installCouponError}
                appliedText={installCouponInfo ? t('coupon.applied', {
                  value: installCouponInfo.discountType === 'percentage' ? `${installCouponInfo.discountValue}%` : `${installCouponInfo.discountValue} DZD`,
                }) : ''}
                placeholder={t('coupon.placeholder')}
                applyLabel={t('coupon.apply')}
              />
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setInstallTarget(null)}
                className="flex-1 px-4 py-2.5 text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors font-medium text-sm"
              >
                {t('coupon.cancel')}
              </button>
              <button
                onClick={() => handleInstallTheme(installTarget.id, installCouponInfo ? installCouponCode.trim() : undefined)}
                disabled={installingId === installTarget.id}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-black rounded-xl active:scale-95 disabled:opacity-50 transition-all"
              >
                {installingId === installTarget.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {t('coupon.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
