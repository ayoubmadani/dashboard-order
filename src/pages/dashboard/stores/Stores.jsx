import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store, Plus, Search, MapPin,
  ExternalLink, Globe, LayoutGrid, X,
  Package, Users,
  Edit2, Trash2, Eye,
  Loader2, AlertCircle, Power,
  RefreshCw, TrendingUp, ShoppingBag, Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import Loading from '../../../components/Loading';

/* ─── Injected styles ─────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  .stores-root { font-family: 'DM Sans', sans-serif; }
  .stores-root h1, .stores-root h2, .stores-root h3 { font-family: 'Syne', sans-serif; }

  /* ── Card shine ── */
  @keyframes shine {
    0% { transform: translateX(-100%) rotate(25deg); }
    100% { transform: translateX(200%) rotate(25deg); }
  }
  .card-shine::after {
    content: '';
    position: absolute;
    top: -60%;
    left: -60%;
    width: 40%;
    height: 200%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
    transform: rotate(25deg);
    transition: none;
    pointer-events: none;
  }
  .card-shine:hover::after { animation: shine 0.7s ease forwards; }

  /* ── Row hover bar ── */
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

  /* ── Pulse badge ── */
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.4); }
  }
  .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

  /* ── Power toggle ── */
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

  /* ── Add card breathing border ── */
  @keyframes dash-flow {
    to { stroke-dashoffset: -100; }
  }

  /* ── Fade in cards ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.4s ease both; }
`;

const Stores = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'stores' });
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [myStores, setMyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingStoreId, setDeletingStoreId] = useState(null);
  const [togglingStoreId, setTogglingStoreId] = useState(null);

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      const response = await axios.get(`${baseURL}/stores/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) setMyStores(response.data.data || []);
    } catch (err) {
      setError(t('stores.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStoreStatus = useCallback(async (storeId, currentStatus) => {
    try {
      setTogglingStoreId(storeId);
      const token = getAccessToken();
      const response = await axios.put(
        `${baseURL}/stores/${storeId}/toggle-status`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMyStores(prev => prev.map(store =>
          store.id === storeId ? { ...store, isActive: !currentStatus } : store
        ));
      }
    } catch (err) {
      alert(err.response?.data?.message || t('stores.toggle.failed'));
    } finally {
      setTogglingStoreId(null);
    }
  }, [t]);

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm(t('stores.delete.confirm'))) return;
    try {
      setDeletingStoreId(storeId);
      const token = getAccessToken();
      await axios.delete(`${baseURL}/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyStores(myStores.filter(store => store.id !== storeId));
      alert(t('stores.delete.success'));
    } catch (err) {
      alert(t('stores.delete.failed'));
    } finally {
      setDeletingStoreId(null);
    }
  };

  const filteredStores = myStores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.contact?.wilaya?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProducts = myStores.reduce((acc, s) => acc + (s.products?.length || 0), 0);
  const totalOrders = myStores.reduce((acc, s) => acc + (s.orders?.length || 0), 0);
  const totalShow = myStores.reduce((acc, s) => acc + (s.shows?.length || 0), 0);

  /* ── Toggle switch ───────────────────────────────────────────────────────── */
  const PowerToggle = ({ isActive, onToggle, disabled, size = 32 }) => (
    <button
      className="pwr-toggle"
      onClick={onToggle}
      disabled={disabled}
      style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      <svg
        width={size} height={size} viewBox="0 0 24 24"
        fill="none" strokeLinecap="round" style={{ background: 'none', display: 'block' }}
      >
        <path d="M12 3v7" strokeWidth="2" stroke={isActive ? '#10b981' : '#d1d5db'} />
        <path d="M7 6.5A8 8 0 1 0 17 6.5" strokeWidth="2" fill="none" stroke={isActive ? '#10b981' : '#d1d5db'} />
      </svg>
    </button>
  );

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-rose-500" />
          <p className="text-gray-900 dark:text-white font-bold mb-4">{error}</p>
          <button onClick={fetchStores} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{styles}</style>

      <div className="stores-root min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ══ SECTION 1 — Header (unchanged) ══════════════════════════════════ */}
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
                { key: 'stores', icon: Store, color: 'indigo', value: myStores.length, sub: t('stores.stats.active_count', { count: myStores.filter(s => s.isActive).length }) },
                { key: 'products', icon: Package, color: 'emerald', value: totalProducts, sub: t('stores.stats.products_sub') },
                { key: 'orders', icon: TrendingUp, color: 'amber', value: totalOrders, sub: t('stores.stats.orders_sub') },
                { key: 'views', icon: Eye, color: 'blue', value: totalShow, sub: t('stores.stats.views_sub') },
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

            {/* Search & toggle */}
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
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* ══ SECTION 2 — Cards & Table ════════════════════════════════════════ */}
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
                      border: store.isActive
                        ? '1px solid rgba(251,191,36,0.25)'
                        : '1px solid rgba(113,113,122,0.15)',
                      opacity: store.isActive ? 1 : 0.65,
                    }}
                  >
                    {/* ── Status top bar ── */}
                    <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${store.isActive ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-300 dark:bg-zinc-700'}`} />

                    <div className="p-4 sm:p-5">

                      {/* ── Header: avatar + name + toggle ── */}
                      <div className="flex items-start gap-3 mb-4">

                        {/* Avatar with online dot */}
                        <div className="relative shrink-0">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl ring-2 ring-offset-2 overflow-hidden
                              ${store.isActive
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30 ring-amber-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 ring-gray-200 dark:ring-zinc-700'}`}
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {store.design?.logoUrl ? (
                              <div className="w-full h-full bg-white flex items-center justify-center">
                                <img
                                  src={store.design.logoUrl}
                                  alt={store.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              </div>
                            ) : (
                              store.name?.charAt(0)?.toUpperCase() || <Store size={22} />
                            )}
                          </div>

                          {/* Online dot */}
                          <div className={`absolute -bottom-1 ${isRtl ? '-left-1' : '-right-1'} w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${store.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                            {store.isActive && <div className="w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75" />}
                          </div>
                        </div>

                        {/* Name + domain */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3
                            className="font-extrabold text-gray-900 dark:text-white text-base leading-tight mb-1 truncate"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                          >
                            {store.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                              mdstore
                            </span>
                            {store.isActive && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                ● {t('common.active')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Power toggle */}
                        <PowerToggle
                          isActive={store.isActive}
                          onToggle={() => handleToggleStoreStatus(store.id, store.isActive)}
                          disabled={isToggling}
                          size={30}
                        />
                      </div>

                      {/* ── Stats badges ── */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                          <Eye size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{store.shows?.length || 0}</span>
                          <span className="text-xs text-indigo-500 dark:text-indigo-400">{t('stores.card.views')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                          <ShoppingBag size={14} className="text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{store.orders?.length || 0}</span>
                          <span className="text-xs text-emerald-500 dark:text-emerald-400">{t('stores.card.orders')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                          <Package size={14} className="text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{store.products?.length || 0}</span>
                          <span className="text-xs text-amber-500 dark:text-amber-400">{t('stores.card.products')}</span>
                        </div>
                      </div>

                      {/* ── Domain row ── */}
                      <div className="flex items-center justify-between mb-4 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Globe size={12} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-zinc-400 truncate font-mono">
                            {store.subdomain}.mdstore.dz
                          </span>
                        </div>
                        {store.contact?.wilaya && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <MapPin size={11} className="text-amber-500" />
                            <span className="text-xs text-gray-500 dark:text-zinc-400">{store.contact.wilaya}</span>
                          </div>
                        )}
                      </div>

                      {/* ── Action buttons ── */}
                      <div className={`flex items-center justify-between gap-1.5 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          disabled={deletingStoreId === store.id}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-50"
                        >
                          {deletingStoreId === store.id
                            ? <Loader2 size={16} className="animate-spin" />
                            : <Trash2 size={16} />}
                        </button>
                      </div>

                      {/* ── Visit link — full width ── */}
                      <a
                        href={`${import.meta.env.VITE_STORE_URL}/${store.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => !store.isActive && e.preventDefault()}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border
                          ${store.isActive
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 border-transparent'
                            : 'bg-gray-50 dark:bg-zinc-800/40 text-gray-400 cursor-not-allowed border-transparent'}`}
                      >
                        <Eye size={14} />
                        <span className="truncate max-w-[180px]">{store.subdomain}.mdstore.dz</span>
                      </a>

                    </div>
                  </div>
                );
              })}

              {/* ── Add new card ── */}
              <Link
                to="/dashboard/stores/create"
                className="group relative min-h-[320px] rounded-2xl flex flex-col items-center justify-center gap-5 overflow-hidden transition-all duration-300 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(245,158,11,0.04), rgba(249,115,22,0.04))',
                  border: '2px dashed rgba(245,158,11,0.25)',
                }}
              >
                {/* Hover bg */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(145deg, rgba(245,158,11,0.08), rgba(249,115,22,0.05))' }}
                />

                {/* Plus circle */}
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))', border: '1.5px dashed rgba(245,158,11,0.4)' }}
                >
                  <Plus size={28} className="text-amber-500 group-hover:text-orange-500 transition-colors" />
                </div>

                <div className="relative text-center px-6">
                  <p className="font-extrabold text-gray-800 dark:text-zinc-200 mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {t('stores.add_card.title')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{t('stores.add_card.subtitle')}</p>
                </div>
              </Link>
            </div>
          )}


          {/* ─── LIST / TABLE VIEW ──────────────────────────────────────────── */}
          {viewMode === 'list' && filteredStores.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
            >
              {/* Table header */}
              <div
                className="grid items-center px-6 py-3"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 80px 80px 80px 120px',
                  background: 'linear-gradient(90deg, #fafafa 0%, #f5f5f5 100%)',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {['store', 'status', 'location', 'orders', 'products', 'views', 'actions'].map((col) => (
                  <span
                    key={col}
                    className={`text-[10px] font-black uppercase tracking-widest text-zinc-400
                      ${col === 'actions' ? 'text-center' : col === 'store' || col === 'location' || col === 'status' ? 'text-start' : 'text-center'}`}
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    {t(`stores.table.${col}`)}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredStores.map((store, idx) => {
                  const isToggling = togglingStoreId === store.id;

                  return (
                    <div
                      key={store.id}
                      className="row-bar grid items-center px-6 py-4 transition-colors hover:bg-amber-50/40 dark:hover:bg-zinc-800/40 fade-up"
                      style={{
                        gridTemplateColumns: '2fr 1fr 1fr 80px 80px 80px 120px',
                        animationDelay: `${idx * 50}ms`,
                        opacity: store.isActive ? 1 : 0.65,
                      }}
                    >
                      {/* Store cell */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0
                            ${store.isActive
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                          style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                          {store.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{store.name}</p>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">{store.subdomain}.mdstore.dz</p>
                        </div>
                      </div>

                      {/* Status cell */}
                      <div className="flex items-center gap-2">
                        <PowerToggle
                          isActive={store.isActive}
                          onToggle={() => handleToggleStoreStatus(store.id, store.isActive)}
                          disabled={isToggling}
                        />
                        <span className={`text-[10px] font-semibold hidden sm:block
                          ${store.isActive ? 'text-emerald-500' : 'text-zinc-400'}`}
                        >
                          {isToggling ? '...' : (store.isActive ? t('common.active') : t('common.inactive'))}
                        </span>
                      </div>

                      {/* Location cell */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <MapPin size={12} className="text-amber-500 shrink-0" />
                        <span className="truncate">{store.contact?.wilaya || '—'}</span>
                      </div>

                      {/* Orders */}
                      <div className="text-center">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {store.orders?.length || 0}
                        </span>
                      </div>

                      {/* Products */}
                      <div className="text-center">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {store.products?.length || 0}
                        </span>
                      </div>

                      {/* Views */}
                      <div className="text-center">
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                          {store.shows?.length || 0}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={`http://localhost:3000/${store.subdomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => !store.isActive && e.preventDefault()}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all
                            ${store.isActive
                              ? 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                              : 'text-zinc-300 cursor-not-allowed'}`}
                        >
                          <Eye size={15} />
                        </a>
                        <button
                          onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          disabled={deletingStoreId === store.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-40"
                        >
                          {deletingStoreId === store.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer row count */}
              <div
                className="px-6 py-3 flex items-center justify-between"
                style={{ background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.05)' }}
              >
                <span className="text-xs text-zinc-400 font-medium">
                  {filteredStores.length} {t('stores.stats.stores')}
                </span>
                <div className="flex gap-1">
                  {filteredStores.slice(0, 5).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ))}
                  {filteredStores.length > 5 && (
                    <span className="text-[10px] text-zinc-400 ml-1">+{filteredStores.length - 5}</span>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* ─── EMPTY STATE ────────────────────────────────────────────────── */}
          {filteredStores.length === 0 && !loading && (
            <div className="text-center py-24 fade-up">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.08))', border: '1.5px dashed rgba(245,158,11,0.3)' }}
              >
                <Store size={32} className="text-amber-500/60" />
              </div>
              <h3
                className="text-xl font-black text-gray-900 dark:text-white mb-2"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {searchQuery ? t('stores.empty.no_results') : t('stores.empty.title')}
              </h3>
              <p className="text-sm text-gray-400 dark:text-zinc-500 mb-8 max-w-xs mx-auto">
                {searchQuery ? t('stores.empty.no_results_sub') : t('stores.empty.subtitle')}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
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