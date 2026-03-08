import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Store, Plus, Search, MapPin, 
  ExternalLink, Globe, LayoutGrid, X,
  Package, Users,
  Edit2, Trash2, Eye,
  Loader2, AlertCircle, Power,
  RefreshCw, TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const Stores = () => {
const { t , i18n} = useTranslation('translation', { keyPrefix: 'stores' });  
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
      console.error('Error fetching stores:', err);
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
      console.error('Error toggling store status:', err);
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
      console.error('Error deleting store:', err);
      alert(t('stores.delete.failed'));
    } finally {
      setDeletingStoreId(null);
    }
  };

  const filteredStores = myStores.filter(store =>
    store.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.contact?.wilaya?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusConfig = {
    true: {
      label: t('common.active'),
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    false: {
      label: t('common.inactive'),
      color: 'bg-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-500/10',
      textColor: 'text-gray-500 dark:text-gray-400',
    },
  };

  const ToggleSwitch = ({ isActive, onToggle, disabled }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900
        ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
      aria-label={isActive ? t('stores.toggle.disable') : t('stores.toggle.enable')}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300
        ${isActive ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')}`}
      />
    </button>
  );

  const totalProducts = myStores.reduce((acc, s) => acc + (s.products?.length || 0), 0);
  const totalOrders = myStores.reduce((acc, s) => acc + (s.orders?.length || 0), 0);

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600 dark:text-zinc-400">{t('stores.loading_stores')}</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-rose-500" />
          <p className="text-gray-900 dark:text-white font-bold mb-4">{error}</p>
          <button
            onClick={fetchStores}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/20">
                <Store size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {t('stores.title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                  {t('stores.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchStores}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
              <Link
                to="/dashboard/stores/create"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                {t('stores.new_store')}
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                key: 'stores', icon: Store, color: 'indigo',
                value: myStores.length,
                sub: t('stores.stats.active_count', { count: myStores.filter(s => s.isActive).length }),
              },
              {
                key: 'products', icon: Package, color: 'emerald',
                value: totalProducts, sub: t('stores.stats.products_sub'),
              },
              {
                key: 'orders', icon: TrendingUp, color: 'amber',
                value: totalOrders, sub: t('stores.stats.orders_sub'),
              },
              {
                key: 'customers', icon: Users, color: 'rose',
                value: myStores.reduce((acc, s) => acc + (s.customers?.length || 0), 0),
                sub: t('stores.stats.customers_sub'),
              },
            ].map(({ key, icon: Icon, color, value, sub }) => (
              <div key={key} className={`bg-gradient-to-br from-${color}-50 to-${color}-100/50 dark:from-${color}-500/10 dark:to-${color}-500/5 p-5 rounded-2xl border border-${color}-100 dark:border-${color}-500/20`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-${color}-500 rounded-lg`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400 uppercase tracking-wider`}>
                    {t(`stores.stats.${key}`)}
                  </span>
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
                <p className={`text-xs text-${color}-600/70 dark:text-${color}-400/70 mt-1`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Search & View Toggle */}
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
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Grid View */}
        {viewMode === 'grid' && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => {
              const status = statusConfig[store.isActive];
              const isToggling = togglingStoreId === store.id;

              return (
                <div
                  key={store.id}
                  className={`group bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden transition-all duration-300 ${
                    store.isActive
                      ? 'border-gray-200 dark:border-zinc-800 hover:shadow-xl hover:border-amber-300 dark:hover:border-amber-500/30'
                      : 'border-gray-200 dark:border-zinc-800 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${status.bgColor}`}>
                        <Store className={status.textColor} size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${status.textColor}`}>
                          {isToggling ? t('common.enabling') : status.label}
                        </span>
                        <ToggleSwitch
                          isActive={store.isActive}
                          onToggle={() => handleToggleStoreStatus(store.id, store.isActive)}
                          disabled={isToggling}
                        />
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
                      {store.name}
                    </h3>

                    <a
                      href={`${import.meta.env.VITE_STORE_URL}/${store.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm transition-all ${
                        store.isActive ? 'text-indigo-600 dark:text-indigo-400 hover:underline' : 'text-gray-400 pointer-events-none'
                      }`}
                      onClick={(e) => !store.isActive && e.preventDefault()}
                    >
                      <Globe size={14} />
                      <span className="line-clamp-1">{store.subdomain}.mdstore.dz</span>
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>

                    {store.contact?.wilaya && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-400 text-sm mt-2">
                        <MapPin size={14} className="text-amber-500 shrink-0" />
                        {store.contact.wilaya}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className={`grid grid-cols-3 border-b border-gray-100 dark:border-zinc-800 ${isRtl ? 'divide-x-reverse' : ''} divide-x divide-gray-100 dark:divide-zinc-800`}>
                    {[
                      { val: store.orders?.length || 0, label: t('stores.card.orders') },
                      { val: store.products?.length || 0, label: t('stores.card.products') },
                      { val: store.customers?.length || 0, label: t('stores.card.customers') },
                    ].map(({ val, label }, i) => (
                      <div key={i} className="p-4 text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{val}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex gap-2">
                    <a
                      href={`http://localhost:3000/${store.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => !store.isActive && e.preventDefault()}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                        store.isActive
                          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                          : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Eye size={16} />
                      {t('stores.card.visit')}
                    </a>
                    <button
                      onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
                    >
                      <Edit2 size={16} />
                      {t('stores.card.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={deletingStoreId === store.id}
                      className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                    >
                      {deletingStoreId === store.id
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Trash2 size={16} />
                      }
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add New Card */}
            <Link
              to="/dashboard/stores/create"
              className="group border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-zinc-600 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all min-h-[380px]"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-solid group-hover:bg-amber-500 group-hover:text-white group-hover:border-transparent transition-all duration-500 group-hover:rotate-90 group-hover:scale-110">
                  <Plus size={32} />
                </div>
                <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 transition-colors">
                  {t('stores.add_card.title')}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{t('stores.add_card.subtitle')}</p>
              </div>
            </Link>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredStores.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                  {['store', 'status', 'location', 'products', 'orders', 'actions'].map((col) => (
                    <th key={col} className={`px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider ${col === 'store' || col === 'location' ? 'text-start' : 'text-center'}`}>
                      {t(`stores.table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredStores.map((store) => {
                  const status = statusConfig[store.isActive];
                  const isToggling = togglingStoreId === store.id;

                  return (
                    <tr key={store.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${!store.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.bgColor}`}>
                            <Store className={status.textColor} size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{store.name}</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{store.subdomain}.mdstore.dz</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <ToggleSwitch
                            isActive={store.isActive}
                            onToggle={() => handleToggleStoreStatus(store.id, store.isActive)}
                            disabled={isToggling}
                          />
                          <span className={`text-xs font-medium ${status.textColor}`}>
                            {isToggling ? t('common.enabling') : status.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                          <MapPin size={14} className="text-amber-500 shrink-0" />
                          {store.contact?.wilaya || '—'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {store.products?.length || 0}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {store.orders?.length || 0}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={`http://localhost:3000/${store.subdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => !store.isActive && e.preventDefault()}
                            className={`p-2 rounded-lg transition-colors ${
                              store.isActive
                                ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            onClick={() => navigate(`/dashboard/stores/update/${store.id}`)}
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            disabled={deletingStoreId === store.id}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingStoreId === store.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredStores.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? t('stores.empty.no_results') : t('stores.empty.title')}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 mb-6">
              {searchQuery ? t('stores.empty.no_results_sub') : t('stores.empty.subtitle')}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                {t('stores.clear_search')}
              </button>
            ) : (
              <Link
                to="/dashboard/stores/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
              >
                <Plus size={20} />
                {t('stores.empty.create')}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
