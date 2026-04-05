import React, { useState, useEffect } from 'react';
import {
  Save, ArrowLeft, Search,
  Home, Building2, RefreshCcw,
  Filter, Plus, Sparkles, Loader2,
  CheckCircle2, XCircle, RotateCcw,
  Truck, Star, ShieldX, Settings2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';

function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─────────────────────────────────────────────
//  Sub-component: price input cell
// ─────────────────────────────────────────────
function PriceCell({ value, onChange, focusRing }) {
  return (
    <div className="relative flex items-center" dir="ltr">
      <input
        type="number"
        min="0"
        dir="ltr"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 pl-3 pr-10 text-sm font-bold text-gray-700 dark:text-zinc-200 ${focusRing} outline-none transition-all`}
      />
      <span className="absolute right-3 text-xs font-semibold text-gray-400 dark:text-zinc-500 pointer-events-none select-none">DA</span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: status checkbox
// ─────────────────────────────────────────────
function StatusToggle({ isActive, onToggle, loading }) {
  return (
    <label className={`relative flex items-center justify-center cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <input type="checkbox" checked={!!isActive} onChange={onToggle} className="sr-only peer" />
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}`}>
        {isActive && !loading && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {loading && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: empty state
// ─────────────────────────────────────────────
function EmptyState({ onInitialize, isLoading }) {
  const { t } = useTranslation('shipping');
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-indigo-400 dark:text-indigo-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-black">!</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-gray-800 dark:text-white">{t('empty.title')}</p>
            <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-xs">{t('empty.subtitle')}</p>
          </div>
          <button
            onClick={onInitialize}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isLoading ? t('empty.initializing') : t('empty.init_btn')}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: wilaya row
// ─────────────────────────────────────────────
function WilayaRow({ wilaya, onPriceChange, onToggle, onSave, toggleLoading, saveLoading }) {
  const { t } = useTranslation('shipping');
  const isSaving   = saveLoading  === wilaya.id;
  const isToggling = toggleLoading === wilaya.id;

  return (
    <tr className="group border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black shrink-0">
            {wilaya.code ?? wilaya.id}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">{wilaya.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 w-36">
        <PriceCell value={wilaya.livraisonHome} onChange={(v) => onPriceChange(wilaya.id, 'livraisonHome', v)} focusRing="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
      </td>
      <td className="px-4 py-3 w-36">
        <PriceCell value={wilaya.livraisonOfice} onChange={(v) => onPriceChange(wilaya.id, 'livraisonOfice', v)} focusRing="focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
      </td>
      <td className="px-4 py-3 w-36">
        <PriceCell value={wilaya.livraisonReturn} onChange={(v) => onPriceChange(wilaya.id, 'livraisonReturn', v)} focusRing="focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusToggle isActive={wilaya.isActive} onToggle={() => onToggle(wilaya.id)} loading={isToggling} />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onSave(wilaya)}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {t('save_row')}
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: Account Selector Modal
//  يختار الحساب النشط من الحسابات المُعدَّة في الإعدادات
// ─────────────────────────────────────────────
function AccountSelectorModal({ storeId, headers, isRtl, onClose, onSelected }) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingId, setSettingId] = useState(null);

  useEffect(() => {
    axios.get(`${baseURL}/stores/${storeId}/shipping/accounts`, headers)
      .then(r => setAccounts(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [storeId]);

  const handleSelect = async (accountId) => {
    setSettingId(accountId);
    try {
      await axios.patch(`${baseURL}/stores/${storeId}/shipping/accounts/${accountId}/default`, {}, headers);
      onSelected();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSettingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Truck className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">اختر حساب الشحن النشط</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500">الحساب المحدد يُستخدم لإنشاء طلبات التوصيل</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors text-lg font-bold">✕</button>
        </div>

        {/* Accounts list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ShieldX className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-white">لا توجد حسابات شحن مُعدَّة</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">اذهب إلى الإعدادات لإضافة حسابات الشحن</p>
              <button
                onClick={() => { onClose(); navigate('/dashboard/settings'); }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                الذهاب إلى الإعدادات
              </button>
            </div>
          ) : (
            accounts.map(account => (
              <button
                key={account.id}
                onClick={() => handleSelect(account.id)}
                disabled={!!settingId}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-${isRtl ? 'right' : 'left'} transition-all disabled:opacity-60 ${
                  account.isDefault
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20'
                    : 'border-gray-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${account.isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  <Truck className={`w-4 h-4 ${account.isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{account.accountName}</p>
                    {account.isDefault && <Star className="w-3 h-3 text-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{account.providerName} · {account.isVerified ? 'مُتحقق ✓' : 'غير مُتحقق'}</p>
                </div>
                {settingId === account.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
                ) : account.isDefault ? (
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                ) : null}
              </button>
            ))
          )}
        </div>

        {/* Footer link to settings */}
        {accounts.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={() => { onClose(); navigate('/dashboard/settings'); }}
              className="text-xs text-indigo-500 hover:underline font-semibold flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" /> إدارة حسابات الشحن في الإعدادات
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: Active provider banner
// ─────────────────────────────────────────────
function ActiveAccountBanner({ settings, onChangeAccount }) {
  const { t } = useTranslation('shipping');
  if (!settings?.configured) return null;

  const { metadata, isVerified, providerName, accountName } = settings;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border mb-5 ${
      isVerified
        ? 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
        : 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
        {metadata?.logo && metadata.logo !== '#' ? (
          <img src={metadata.logo} alt={providerName} className="w-8 h-8 object-contain" />
        ) : (
          <Truck className={`w-5 h-5 ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-gray-800 dark:text-white">{accountName ?? metadata?.title ?? providerName}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isVerified
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          }`}>
            {isVerified ? t('provider.active', 'نشط') : t('provider.unverified', 'غير مُتحقق')}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{metadata?.description ?? providerName}</p>
      </div>

      <button
        onClick={onChangeAccount}
        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shrink-0"
      >
        <Settings2 className="w-3.5 h-3.5" />
        تغيير
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────
export default function Shipping() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'shipping' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const headers = useAuthHeaders();

  const [wilayas,          setWilayas]          = useState([]);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isInitializing,   setIsInitializing]   = useState(false);
  const [isSavingAll,      setIsSavingAll]      = useState(false);
  const [toggleLoading,    setToggleLoading]    = useState(null);
  const [saveLoading,      setSaveLoading]      = useState(null);
  const [toast,            setToast]            = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [providerSettings, setProviderSettings] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProviderSettings = async () => {
    if (!storeId) return;
    try {
      const { data } = await axios.get(`${baseURL}/stores/${storeId}/shipping/settings`, headers);
      setProviderSettings(data);
    } catch { setProviderSettings(null); }
  };

  const getShipping = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
      setWilayas(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات الشحن:', error);
      showToast('error', t('toast.fetch_error'));
    }
  };

  useEffect(() => {
    getShipping();
    loadProviderSettings();
  }, []);

  const handleCreateAll = async () => {
    setIsInitializing(true);
    try {
      const getResponse = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
      let finalData = getResponse.data;
      if (!finalData || finalData.length === 0) {
        await axios.get(`${baseURL}/shipping/create-shipping`, headers);
        const refreshResponse = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
        finalData = refreshResponse.data;
      }
      setWilayas(finalData);
      showToast('success', t('toast.init_success'));
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 409) {
        const fallback = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
        setWilayas(fallback.data);
        showToast('success', t('toast.init_loaded'));
      } else {
        showToast('error', t('toast.init_error'));
      }
    } finally { setIsInitializing(false); }
  };

  const handleSaveRow = async (wilaya) => {
    setSaveLoading(wilaya.id);
    try {
      await axios.post(
        `${baseURL}/shipping/update-shipping`,
        [{ wilayaId: wilaya.id, priceHome: wilaya.livraisonHome, priceOffice: wilaya.livraisonOfice, priceReturn: wilaya.livraisonReturn, isActive: wilaya.isActive }],
        headers,
      );
      showToast('success', t('toast.save_success', { name: wilaya.name }));
    } catch { showToast('error', t('toast.save_error', { name: wilaya.name })); }
    finally { setSaveLoading(null); }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      const payload = wilayas.map(w => ({ wilayaId: w.id, priceHome: w.livraisonHome, priceOffice: w.livraisonOfice, priceReturn: w.livraisonReturn, isActive: w.isActive }));
      await axios.post(`${baseURL}/shipping/update-shipping`, payload, headers);
      showToast('success', t('toast.save_all_success'));
    } catch { showToast('error', t('toast.save_all_error')); }
    finally { setIsSavingAll(false); }
  };

  const handlePriceChange = (id, field, value) =>
    setWilayas(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const toggleStatus = async (id) => {
    const wilaya = wilayas.find(w => w.id === id);
    if (!wilaya) return;
    setToggleLoading(id);
    try {
      await axios.post(`${baseURL}/shipping/update-shipping`, [{ wilayaId: id, isActive: !wilaya.isActive }], headers);
      await getShipping();
    } catch { showToast('error', t('toast.toggle_error')); }
    finally { setToggleLoading(null); }
  };

  const filteredWilayas = wilayas.filter(
    w => w.name.includes(searchQuery) || String(w.code ?? w.id).includes(searchQuery)
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 md:p-8 font-sans">

      {/* ── Account selector modal ── */}
      {showAccountModal && storeId && (
        <AccountSelectorModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          onClose={() => setShowAccountModal(false)}
          onSelected={loadProviderSettings}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 ${isRtl ? 'left-5' : 'right-5'} z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          

          {wilayas.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('save_all')}
            </button>
          )}
        </div>
      </div>

      {/* ── Active account banner ── */}
      {storeId && (
        <ActiveAccountBanner
          settings={providerSettings}
          onChangeAccount={() => setShowAccountModal(true)}
        />
      )}

      {/* ── No account warning ── */}
      {storeId && providerSettings && !providerSettings.configured && (
        <div className="flex items-center gap-3 px-5 py-4 mb-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
          <ShieldX className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('provider.not_configured', 'لم يتم تفعيل مزود شحن')}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70">{t('provider.not_configured_hint', 'يجب اختيار شركة توصيل لإنشاء طلبات الشحن')}</p>
          </div>
          <button onClick={() => setShowAccountModal(true)} className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold transition-all">
            اختيار
          </button>
        </div>
      )}

      {/* ── Search & Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl py-3 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 dark:focus:border-indigo-600 dark:text-white text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-600 transition-all shadow-sm`}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all">
          <Filter className="w-4 h-4" /> {t('filter_region')}
        </button>
        <button onClick={getShipping} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all" title={t('refresh')}>
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3 text-start text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('col_state')}</th>
                <th className="px-4 py-3 text-start text-xs font-bold text-indigo-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5" />{t('col_home')}</div>
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{t('col_office')}</div>
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-rose-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5" />{t('col_return')}</div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('col_status')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody>
              {wilayas.length === 0 ? (
                <EmptyState onInitialize={handleCreateAll} isLoading={isInitializing} />
              ) : filteredWilayas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 dark:text-zinc-600 text-sm font-medium">{t('no_results')}</td>
                </tr>
              ) : filteredWilayas.map(wilaya => (
                <WilayaRow
                  key={wilaya.id}
                  wilaya={wilaya}
                  onPriceChange={handlePriceChange}
                  onToggle={toggleStatus}
                  onSave={handleSaveRow}
                  toggleLoading={toggleLoading}
                  saveLoading={saveLoading}
                />
              ))}
            </tbody>
          </table>
        </div>

        {wilayas.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('note')}</p>
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
            >
              {isSavingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t('bulk_save')}
            </button>
          </div>
        )}
      </div>

      {wilayas.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-3 text-center">
          {t('count', { filtered: filteredWilayas.length, total: wilayas.length })}
        </p>
      )}
    </div>
  );
}