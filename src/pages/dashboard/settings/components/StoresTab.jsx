import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, Plus, Edit2, Trash2, ExternalLink, Loader2, CheckCircle2, Eye, ShoppingBag, Package, AlertTriangle, Undo2, SkipForward } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import SectionTitle from './SectionTitle';

const getCount = (store, key) => store[`${key}Count`] ?? store[key]?.length ?? 0;
const REQUIRED_DELETE_TEXT = 'DELETE';

export default function StoresTab() {
  const { t } = useTranslation('translation', { keyPrefix: 'settings' });
  const { t: tStores } = useTranslation('translation', { keyPrefix: 'stores' });
  const navigate = useNavigate();
  const { myStores, fetchStores, setSelectedProject } = useOutletContext();
  const token = getAccessToken();
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentStoreId, setCurrentStoreId] = useState(() => localStorage.getItem('storeId'));
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, store: null, phase: 'confirm' });
  const [confirmText, setConfirmText] = useState('');
  const [countdown, setCountdown] = useState(10);
  const isDeleteConfirmed = confirmText.trim().toUpperCase() === REQUIRED_DELETE_TEXT;
  const countdownIntervalRef = useRef(null);
  const countdownTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
  }, []);

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

  const clearCountdownTimers = () => {
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    if (countdownTimeoutRef.current) { clearTimeout(countdownTimeoutRef.current); countdownTimeoutRef.current = null; }
  };

  const executeStoreDelete = async (storeId) => {
    setDeletingId(storeId);
    try {
      await axios.delete(`${baseURL}/stores/${storeId}`, headers);
      await fetchStores();
    } catch (e) { console.error(e); }
    finally {
      setDeletingId(null);
      setDeleteModal({ isOpen: false, store: null, phase: 'confirm' });
      setConfirmText('');
      setCountdown(10);
    }
  };

  const startDeleteCountdown = () => {
    const storeId = deleteModal.store?.id;
    if (!storeId) return;
    setDeleteModal(prev => ({ ...prev, phase: 'countdown' }));
    setCountdown(10);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => Math.max(prev - 1, 0));
    }, 1000);
    countdownTimeoutRef.current = setTimeout(() => {
      clearCountdownTimers();
      executeStoreDelete(storeId);
    }, 10000);
  };

  const cancelDeleteCountdown = () => {
    clearCountdownTimers();
    setDeleteModal({ isOpen: false, store: null, phase: 'confirm' });
    setConfirmText('');
    setCountdown(10);
  };

  const skipDeleteCountdown = () => {
    const storeId = deleteModal.store?.id;
    clearCountdownTimers();
    if (storeId) executeStoreDelete(storeId);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
      {deleteModal.isOpen && deleteModal.store && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800">
            {deleteModal.phase === 'confirm' ? (
              <>
                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Trash2 size={26} className="text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-1">
                  {tStores('stores.delete_modal.title')}
                </h3>
                <p className="text-sm text-center text-gray-500 dark:text-zinc-400 mb-4">
                  {tStores('stores.delete_modal.about_to_delete')}{' '}
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">"{deleteModal.store.name}"</span>
                </p>

                <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-3.5 mb-5">
                  <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    {tStores('stores.delete_modal.warning', {
                      products: getCount(deleteModal.store, 'products'),
                      orders: getCount(deleteModal.store, 'orders'),
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 mb-5">
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2 text-center">
                    {tStores('stores.delete_modal.type_to_confirm')}
                  </p>
                  <p className="text-center font-mono font-bold text-rose-600 dark:text-rose-400 mb-3 text-sm">
                    {REQUIRED_DELETE_TEXT}
                  </p>
                  <input
                    type="text"
                    placeholder={tStores('stores.delete_modal.type_placeholder')}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-rose-500 dark:bg-zinc-900 dark:text-white text-sm text-center font-medium transition-all"
                    onChange={(e) => setConfirmText(e.target.value)}
                    value={confirmText}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDeleteCountdown}
                    className="flex-1 px-4 py-2.5 text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors font-medium text-sm"
                  >
                    {tStores('stores.delete_modal.cancel')}
                  </button>
                  <button
                    onClick={startDeleteCountdown}
                    disabled={!isDeleteConfirmed}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isDeleteConfirmed ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'}`}
                  >
                    {tStores('stores.delete_modal.confirm')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 relative">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-gray-100 dark:stroke-zinc-800" />
                    <circle
                      cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                      strokeLinecap="round"
                      className="stroke-rose-500"
                      style={{
                        strokeDasharray: 2 * Math.PI * 28,
                        strokeDashoffset: 2 * Math.PI * 28 * (1 - countdown / 10),
                        transition: 'stroke-dashoffset 1s linear',
                      }}
                    />
                  </svg>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">{countdown}</span>
                </div>
                <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-1">
                  {tStores('stores.delete_modal.deleting_title')}
                </h3>
                <p className="text-sm text-center text-gray-500 dark:text-zinc-400 mb-6">
                  {tStores('stores.delete_modal.deleting_in', { seconds: countdown, name: deleteModal.store.name })}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDeleteCountdown}
                    className="flex-1 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Undo2 size={16} />
                    {tStores('stores.delete_modal.undo')}
                  </button>
                  <button
                    onClick={skipDeleteCountdown}
                    disabled={deletingId === deleteModal.store.id}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {deletingId === deleteModal.store.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <SkipForward size={16} />}
                    {tStores('stores.delete_modal.skip_now')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                    onClick={() => navigate(`/dashboard/settings/stores/edit/${store.id}`)}
                    className="p-2 rounded-xl text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, store, phase: 'confirm' })}
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
