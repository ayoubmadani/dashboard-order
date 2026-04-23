import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2, Palette, Layers, LayoutGrid,
  ExternalLink, Download, CheckCircle2,
  ChevronLeft, ChevronRight, Zap, Crown,
} from 'lucide-react';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import Loading from '../../../components/Loading';

const DEFAULT_IMAGE = 'https://bloomidea.com/sites/default/files/styles/og_image/public/blog/Tipos%20de%20come%CC%81rcio%20electro%CC%81nico_0.png?itok=jC9MlQZq';
const ITEMS_PER_PAGE = 6;

export default function Theme() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'theme' });
  const isRtl = i18n.dir() === 'rtl';

  const [themes, setThemes] = useState([]);
  const [myTheme, setMyTheme] = useState([]);
  const [planTheme, setPlanTheme] = useState([]);
  const [types, setTypes] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [idActive, setIdActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  async function getInitialData() {
    try {
      const [typesRes, myThemeRes, planThemeRes, store, planRes] = await Promise.all([
        axios.get(`${baseURL}/theme/type`),
        axios.get(`${baseURL}/theme/my`, headers),
        axios.get(`${baseURL}/theme/plan-sub`, headers),
        axios.get(`${baseURL}/stores/${storeId}`, headers),
        axios.get(`${baseURL}/theme/plan-info`, headers),
      ]);

      setTypes(typesRes.data ?? []);
      setMyTheme(myThemeRes.data ?? []);
      setPlanTheme(planThemeRes.data ?? []);
      setIdActive(store.data?.data?.themeId ?? '');
      setPlanInfo(planRes.data ?? null);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }

  useEffect(() => { getInitialData(); }, []);

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

  // ── الدالة المطلوبة (فارغة للتعديل) ──
  const handleActiveThemePlan = async (themeId) => {
    if (!storeId) { 
        alert(t('alerts.no_store')); 
        return; 
    }

    setActivatingId(themeId ?? 'default');
    
    try {
        const res = await axios.post(`${baseURL}/theme/active-theme-plan`, { 
            themeId, 
            storeId 
        }, headers);

        // التحقق مما إذا كان الرد ناجحاً (Status 200-299)
        if (res.status === 200 || res.status === 201) {
            setIdActive(themeId);
            alert(t('alerts.activate_success'));
        }
    } catch (error) {
        // جلب رسالة الخطأ من الـ Backend إذا وجدت
        const errorMessage = error.response?.data?.message || t('alerts.activate_error');
        alert(errorMessage);
        console.error("Activation Error:", error);
    } finally {
        setActivatingId(null);
    }
};

  const handleActiveTheme = async (themeId) => {
    if (!storeId) { alert(t('alerts.no_store')); return; }
    setActivatingId(themeId ?? 'default');
    try {
      const res = await axios.post(`${baseURL}/theme/active-theme`, { themeId, storeId }, headers);
      if (res.data.success) {
        setIdActive(themeId);
        alert(t('alerts.activate_success'));
      }
    } catch (error) {
      alert(t('alerts.activate_error'));
    } finally {
      setActivatingId(null);
    }
  };

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
      getInitialData();
    } catch (error) {
      console.error('Connection error:', error.message);
    } finally {
      setInstallingId(null);
    }
  };

  const totalPages = Math.ceil(themes.length / ITEMS_PER_PAGE);
  const paginatedThemes = themes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading && themes.length === 0 && types.length === 0) return <Loading />;

  const planThemeIds = planInfo?.planThemeIds ?? [];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-6 md:p-8 space-y-8 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── قسم ثيماتي ── */}
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

      {/* ── قسم ثيمات الخطة (باللون الأزرق) ── */}
      {planTheme.length > 0 && (
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-blue-500/5 blur-3xl -z-0" />
          <div className="flex items-center gap-2.5 mb-6 relative z-10">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-xl text-blue-600 dark:text-blue-400">
              <Crown size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('subscription.title')}</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
            {planTheme.map((item) => (
              <ThemeCardPlan
                key={item.id}
                image={item.imageUrl}
                name={item.name_en}
                isActivating={activatingId === item.id}
                isActive={idActive === item.id}
                onActivate={() => handleActiveThemePlan(item.id)}
                activateLabel={t('my_themes.activate_btn')}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── قسم الفلترة ── */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-xl text-purple-600">
            <Layers size={18} />
          </div>
          <h2 className="text-lg font-bold">{t('types.title')}</h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <FilterPill label={t('types.all')} active={selectedType === 'all'} onClick={() => {setSelectedType('all'); setCurrentPage(1);}} />
          {types.map((type) => (
            <FilterPill key={type.id} label={type.name} active={selectedType === type.id} onClick={() => {setSelectedType(type.id); setCurrentPage(1);}} />
          ))}
        </div>
      </section>

      {/* ── معرض الثيمات ── */}
      <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600">
              <LayoutGrid size={18} />
            </div>
            <h2 className="text-lg font-bold">{t('gallery.title')}</h2>
          </div>
        </div>

        {themes.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p>{t('gallery.empty_title')}</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedThemes.map((item) => {
                const isFree = Number(item.price) === 0;
                const isIncludedInPlan = planThemeIds.includes(item.id);
                const isInstalled = myTheme.some(t => t.id === item.id);
                return (
                  <div key={item.id} className="group bg-gray-50 dark:bg-zinc-950 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 hover:shadow-xl transition-all">
                    <div className="relative h-48 bg-gray-100 dark:bg-zinc-800">
                      <img src={item.imageUrl || DEFAULT_IMAGE} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        {isIncludedInPlan && <span className="flex items-center gap-1 bg-indigo-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg"><Crown size={10} />{t('gallery.plan_included_label')}</span>}
                        {isInstalled && <span className="flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg"><CheckCircle2 size={10} />{t('gallery.installed_label')}</span>}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold mb-1">{item.name_en}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.desc_en}</p>
                      <div className="flex gap-2">
                        <a href={`${storeURL}/show/${item.slug}`} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-sm font-bold"><ExternalLink size={14} />{t('gallery.preview_btn')}</a>
                        <button onClick={() => handleInstallTheme(item.id)} disabled={installingId === item.id || isInstalled} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-xl text-sm font-bold ${isInstalled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white'}`}>
                          {installingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          {isInstalled ? t('gallery.installed_label') : t('gallery.install_btn')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} isRtl={isRtl} />}
          </>
        )}
      </section>
    </div>
  );
}

// ── المكونات الفرعية ──

function ThemeCard({ image, name, isActivating, onActivate, activateLabel, isDefault, isActive = false }) {
  return (
    <div className={`relative flex-shrink-0 w-56 rounded-2xl overflow-hidden border-2 transition-all ${isActive ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-gray-200 dark:border-zinc-700'}`}>
      <div className="relative h-32 bg-gray-100"><img src={image} className="w-full h-full object-cover" /></div>
      <div className="px-3 py-3 flex items-center justify-between gap-2 bg-white dark:bg-zinc-900">
        <span className="text-xs font-bold truncate">{name}</span>
        <button onClick={onActivate} disabled={isActive || isActivating} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg ${isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {isActivating ? <Loader2 size={11} className="animate-spin" /> : isActive ? 'مفعّل' : activateLabel}
        </button>
      </div>
    </div>
  );
}

function ThemeCardPlan({ image, name, isActivating, onActivate, activateLabel, isActive = false }) {
  return (
    <div className={`relative flex-shrink-0 w-56 rounded-2xl overflow-hidden border-2 transition-all ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-200 dark:border-zinc-700 hover:border-blue-400'}`}>
      <div className="relative h-32 bg-gray-100">
        <img src={image} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
          <Crown size={10} /> احترافي
        </div>
      </div>
      <div className={`px-3 py-3 flex items-center justify-between gap-2 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-white dark:bg-zinc-900'}`}>
        <span className={`text-xs font-bold truncate ${isActive ? 'text-blue-700' : ''}`}>{name}</span>
        <button onClick={onActivate} disabled={isActive || isActivating} className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${isActive ? 'bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}>
          {isActivating ? <Loader2 size={11} className="animate-spin" /> : isActive ? 'مفعّل' : activateLabel}
        </button>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-indigo-600 text-white shadow-indigo-500/25' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700'}`}>
      {label}
    </button>
  );
}

function Pagination({ currentPage, totalPages, onPageChange, isRtl }) {
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  return (
    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-100">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border rounded-xl disabled:opacity-30"><PrevIcon size={18} /></button>
      <span className="text-sm font-bold">صفحة {currentPage} من {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border rounded-xl disabled:opacity-30"><NextIcon size={18} /></button>
    </div>
  );
}