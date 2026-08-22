import React, { useState } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, Plus, Edit2, Trash2, ExternalLink, Loader2, CheckCircle2, Eye, ShoppingBag, Package } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import SectionTitle from './SectionTitle';

const getCount = (store, key) => store[`${key}Count`] ?? store[key]?.length ?? 0;

export default function StoresTab() {
  const { t } = useTranslation('translation', { keyPrefix: 'settings' });
  const navigate = useNavigate();
  const { myStores, fetchStores, setSelectedProject } = useOutletContext();
  const token = getAccessToken();
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentStoreId, setCurrentStoreId] = useState(() => localStorage.getItem('storeId'));

  const stores = myStores || [];
  const loading = !myStores;

  const handleSelect = (store) => {
    localStorage.setItem('storeId', store.id);
    localStorage.setItem('storeName', store.name);
    setCurrentStoreId(store.id);
    setSelectedProject?.(store);
  };

  const handleToggle = async (storeId) => {
    setTogglingId(storeId);
    try {
      await axios.put(`${baseURL}/stores/${storeId}/toggle-status`, {}, headers);
      await fetchStores();
    } catch (e) { console.error(e); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async (storeId) => {
    if (!window.confirm(t('stores_delete_confirm'))) return;
    setDeletingId(storeId);
    try {
      await axios.delete(`${baseURL}/stores/${storeId}`, headers);
      await fetchStores();
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle>{t('tab_stores')}</SectionTitle>
        <Link
          to="/dashboard/settings/stores/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0 -mt-6"
        >
          <Plus size={15} /> {t('stores_new')}
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Store className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-white">{t('stores_empty_title')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t('stores_empty_subtitle')}</p>
          </div>
          <Link
            to="/dashboard/settings/stores/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus size={15} /> {t('stores_new')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 max-h-[62vh] overflow-y-auto pr-1 scrollbar-thin">
          {stores.map((store) => {
            const isCurrent = store.id === currentStoreId;
            return (
              <div
                key={store.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border bg-gray-50 dark:bg-zinc-800/40 transition-all ${isCurrent
                  ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400/40'
                  : 'border-gray-100 dark:border-zinc-800'}`}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 overflow-hidden font-black text-indigo-500">
                  {store.design?.logoUrl ? (
                    <img src={store.design.logoUrl} alt={store.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    store.name?.charAt(0)?.toUpperCase() || <Store size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">{store.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${store.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'
                      : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'}`}
                    >
                      {store.isActive ? t('stores_active') : t('stores_inactive')}
                    </span>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 size={10} /> {t('stores_current')}
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://${store.subdomain}.mdstore.top`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate"
                  >
                    {store.subdomain}.mdstore.top <ExternalLink size={10} className="shrink-0" />
                  </a>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                      <Eye size={11} /> {getCount(store, 'shows')} {t('stores_views')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                      <ShoppingBag size={11} /> {getCount(store, 'orders')} {t('stores_orders')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                      <Package size={11} /> {getCount(store, 'products')} {t('stores_products')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isCurrent && (
                    <button
                      onClick={() => handleSelect(store)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-500 text-xs font-bold transition-all"
                    >
                      <CheckCircle2 size={14} /> {t('stores_select')}
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(store.id)}
                    disabled={togglingId === store.id}
                    className="p-2 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50"
                    title={store.isActive ? t('stores_inactive') : t('stores_active')}
                  >
                    {togglingId === store.id ? <Loader2 size={15} className="animate-spin" /> : <Store size={15} />}
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/stores/edit/${store.id}`)}
                    className="p-2 rounded-xl text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    disabled={deletingId === store.id}
                    className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-50"
                  >
                    {deletingId === store.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
