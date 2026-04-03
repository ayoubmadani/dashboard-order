import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store, Plus, Search, MapPin,
  Globe, LayoutGrid, X,
  Package,
  Edit2, Trash2, Eye,
  Loader2, AlertCircle,
  RefreshCw, TrendingUp, ShoppingBag,
} from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import Loading from '../../../components/Loading';
import { ExternalLink } from 'lucide-react';

/* ─── Injected styles ─────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  .stores-root { font-family: 'DM Sans', sans-serif; }
  .stores-root h1, .stores-root h2, .stores-root h3 { font-family: 'Syne', sans-serif; }

  @keyframes shine {
    0% { transform: translateX(-100%) rotate(25deg); }
    100% { transform: translateX(200%) rotate(25deg); }
  }
  .card-shine::after {
    content: '';
    position: absolute;
    top: -60%; left: -60%;
    width: 40%; height: 200%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    transform: rotate(25deg);
    transition: none;
    pointer-events: none;
  }
  .card-shine:hover::after { animation: shine 0.7s ease forwards; }

  .row-bar { position: relative; }
  .row-bar::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #f59e0b, #f97316);
    border-radius: 0 2px 2px 0;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .row-bar:hover::before { opacity: 1; }

  button.pwr-toggle {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.13s;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    -webkit-appearance: none;
  }
  button.pwr-toggle:active { transform: scale(0.82); }
  button.pwr-toggle path { transition: stroke 0.25s; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.4s ease both; }
`;

const PowerToggle = ({ isActive, onToggle, disabled, size = 32 }) => (
  <button
    className="pwr-toggle"
    onClick={onToggle}
    disabled={disabled}
    style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" style={{ background: 'none', display: 'block' }}>
      <path d="M12 3v7" strokeWidth="2" stroke={isActive ? '#10b981' : '#d1d5db'} />
      <path d="M7 6.5A8 8 0 1 0 17 6.5" strokeWidth="2" fill="none" stroke={isActive ? '#10b981' : '#d1d5db'} />
    </svg>
  </button>
);

const Stores = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'stores' });
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [deletingStoreId, setDeletingStoreId] = useState(null);
  const [togglingStoreId, setTogglingStoreId] = useState(null);

  const { myStores, fetchStores } = useOutletContext();
  const stores = myStores || [];
  const loading = !myStores;

  const handleToggleStoreStatus = useCallback(async (storeId, currentStatus) => {
    try {
      setTogglingStoreId(storeId);
      const token = getAccessToken();
      const response = await axios.put(
        `${baseURL}/stores/${storeId}/toggle-status`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) await fetchStores();
    } catch (err) {
      alert(err.response?.data?.message || t('stores.toggle.failed'));
    } finally {
      setTogglingStoreId(null);
    }
  }, [t, fetchStores]);

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm(t('stores.delete.confirm'))) return;
    try {
      setDeletingStoreId(storeId);
      const token = getAccessToken();
      await axios.delete(`${baseURL}/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchStores();
    } catch (err) {
      alert(t('stores.delete.failed'));
    } finally {
      setDeletingStoreId(null);
    }
  };

  if (loading) return <Loading />;

  const filteredStores = stores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.contact?.wilaya?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProducts = stores.reduce((acc, s) => acc + (s.productsCount ?? s.products?.length ?? 0), 0);
  const totalOrders = stores.reduce((acc, s) => acc + (s.ordersCount ?? s.orders?.length ?? 0), 0);
  const totalShows = stores.reduce((acc, s) => acc + (s.showsCount ?? s.shows?.length ?? 0), 0);

  const getCount = (store, key) => store[`${key}Count`] ?? store[key]?.length ?? 0;

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{styles}</style>

      <div className="stores-root min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ══ Header ══════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-8">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20">
                  <Store size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('stores.title')}</h1>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('stores.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchStores}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RefreshCw size={16} />{t('common.refresh')}
                </button>
                <Link
                  to="/dashboard/stores/create"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Plus size={18} />{t('stores.new_store')}
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { key: 'stores', icon: Store, color: 'indigo', value: stores.length, sub: t('stores.stats.active_count', { count: stores.filter(s => s.isActive).length }) },
                { key: 'products', icon: Package, color: 'emerald', value: totalProducts, sub: t('stores.stats.products_sub') },
                { key: 'orders', icon: TrendingUp, color: 'amber', value: totalOrders, sub: t('stores.stats.orders_sub') },
                { key: 'views', icon: Eye, color: 'blue', value: totalShows, sub: t('stores.stats.views_sub') },
              ].map(({ key, icon: Icon, color, value, sub }) => (
                <div key={key} className={`bg-gradient-to-br from-${color}-50 to-${color}-100/50 dark:from-zinc-800 dark:to-zinc-900 p-5 rounded-2xl border border-${color}-100 dark:border-zinc-700 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-${color}-500 rounded-lg`}><Icon size={16} className="text-white" /></div>
                    <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400 uppercase tracking-wider`}>{t(`stores.stats.${key}`)}</span>
                  </div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Search & view toggle */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                <input
                  type="text"
                  placeholder={t('stores.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ Cards & Table ════════════════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* ─── GRID VIEW ──────────────────────────────────────────────────── */}
          {viewMode === 'grid' && filteredStores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStores.map((store, idx) => {
                const isToggling = togglingStoreId === store.id;
                return (
                  <div
                    key={store.id}
                    className="card-shine fade-up relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                    style={{
                      animationDelay: `${idx * 60}ms`,
                      border: store.isActive ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(113,113,122,0.15)',
                      opacity: store.isActive ? 1 : 0.65,
                    }}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${store.isActive ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-300 dark:bg-zinc-700'}`} />

                    <div className="p-4 sm:p-5">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative shrink-0">
                          <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl ring-2 ring-offset-2 overflow-hidden
                              ${store.isActive
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30 ring-amber-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 ring-gray-200 dark:ring-zinc-700'}`}
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {store.design?.logoUrl ? (
                              <img src={store.design.logoUrl} alt={store.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              store.name?.charAt(0)?.toUpperCase() || <Store size={22} />
                            )}
                          </div>
                          <div className={`absolute -bottom-1 ${isRtl ? '-left-1' : '-right-1'} w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${store.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                            {store.isActive && <div className="w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight mb-1 truncate" style={{ fontFamily: 'Syne, sans-serif' }}>
                            {store.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">mdstore</span>
                            {store.isActive && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● {t('common.active')}</span>}
                          </div>
                        </div>

                        <PowerToggle isActive={store.isActive} onToggle={() => handleToggleStoreStatus(store.id, store.isActive)} disabled={isToggling} size={30} />
                      </div>

                      {/* Stats badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                          <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{getCount(store, 'shows')}</span>
                          <span className="text-xs text-indigo-500 dark:text-indigo-400">{t('stores.card.views')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                          <ShoppingBag size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{getCount(store, 'orders')}</span>
                          <span className="text-xs text-emerald-500 dark:text-emerald-400">{t('stores.card.orders')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                          <Package size={14} className="text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{getCount(store, 'products')}</span>
                          <span className="text-xs text-amber-500 dark:text-amber-400">{t('stores.card.products')}</span>
                        </div>
                      </div>

                      {/* Domain row - Enhanced Browser Style */}
                      <div className="flex items-center justify-between mb-4 p-2.5 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-transparent hover:border-blue-500/20 transition-all group/link">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* أيقونة الكرة الأرضية تتلون عند التمرير */}
                          <Globe size={14} className="text-gray-400 shrink-0 group-hover/link:text-blue-500 transition-colors" />

                          <a
                            href={`https://${store.subdomain}.${import.meta.env.VITE_STORE_URL}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 truncate font-mono font-bold transition-all hover:underline underline-offset-4 decoration-2"
                          >
                            {store.subdomain}.mdstore.dz
                          </a>
                        </div>

                        {/* معلومات الموقع وأيقونة الخروج */}
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          {store.contact?.wilaya && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-zinc-700 rounded-lg border border-gray-100 dark:border-zinc-600 shadow-sm">
                              <MapPin size={11} className="text-amber-500" />
                              <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-tight">
                                {store.contact.wilaya}
                              </span>
                            </div>
                          )}

                          {/* أيقونة تظهر بوضوح عند تمرير الماوس لتأكيد أنه رابط خارجي */}
                          <ExternalLink size={12} className="text-gray-300 group-hover/link:text-blue-500 transition-colors" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`flex items-center justify-between gap-1.5 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          disabled={deletingStoreId === store.id}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-50"
                        >
                          {deletingStoreId === store.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        

          {/* ─── EMPTY STATE ────────────────────────────────────────────────── */}
          {filteredStores.length === 0 && (
            <div className="text-center py-24 fade-up">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.08))', border: '1.5px dashed rgba(245,158,11,0.3)' }}
              >
                <Store size={32} className="text-amber-500/60" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                {searchQuery ? t('stores.empty.no_results') : t('stores.empty.title')}
              </h3>
              <p className="text-sm text-gray-400 dark:text-zinc-500 mb-8 max-w-xs mx-auto">
                {searchQuery ? t('stores.empty.no_results_sub') : t('stores.empty.subtitle')}
              </p>
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity text-sm">
                  {t('stores.clear_search')}
                </button>
              ) : (
                <Link
                  to="/dashboard/stores/create"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                >
                  <Plus size={18} />
                  {t('stores.empty.create')}
                </Link>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Stores;