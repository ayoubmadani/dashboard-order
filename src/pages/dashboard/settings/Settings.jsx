import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon, User, Bell,
  Globe, Save, Moon, Sun, Loader2, ExternalLink,
  CreditCard, CheckCircle2, CalendarDays, Zap, ChevronRight,
  Store, Package, FileText, TrendingUp,
  Truck, Plug, Shield, ShieldCheck, ShieldX,
  Eye, EyeOff, Search, X, Star, Trash2, Plus,
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// ─── helpers ─────────────────────────────────────────────────────────────────

const isFree = (plan) =>
  Number(plan?.monthlyPrice ?? 0) === 0 && Number(plan?.yearlyPrice ?? 0) === 0;

const getPlanPrice = (plan, interval) =>
  interval === 'year' ? Number(plan?.yearlyPrice ?? 0) : Number(plan?.monthlyPrice ?? 0);

const buildFeatureSummary = (features, t) => {
  if (!features) return [];
  const rows = [];
  if (features.storeNumber) rows.push({ icon: Store, text: `${features.storeNumber} ${t('feat_stores')}` });
  if (features.productNumber) rows.push({ icon: Package, text: `${features.productNumber} ${t('feat_products')}` });
  if (features.landingPageNumber) rows.push({ icon: FileText, text: `${features.landingPageNumber} ${t('feat_pages')}` });
  if (Number(features.commission) > 0)
    rows.push({ icon: TrendingUp, text: `${Number(features.commission).toFixed(1)}% ${t('feat_commission')}` });
  return rows;
};

// ─── Shipping sub-components ──────────────────────────────────────────────────

function CredentialField({ label, fieldKey, value, onChange, isPassword }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && !visible ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={`Enter ${label}`}
          dir="ltr"
          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 pr-10 text-sm font-medium text-gray-700 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ProviderCard({ provider, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(provider)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20'
          : 'border-gray-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
      }`}
    >
      {provider.logo && provider.logo !== '#' ? (
        <img src={provider.logo} alt={provider.title} className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-gray-100 dark:border-zinc-700 shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <Truck className="w-4 h-4 text-indigo-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{provider.title}</p>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{provider.description?.slice(0, 40)}...</p>
      </div>
      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
    </button>
  );
}

/** Modal for adding a new shipping account */
function AddAccountModal({ storeId, headers, isRtl, onClose, onSaved, t }) {
  const [providers, setProviders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [accountName, setAccountName] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    axios.get(`${baseURL}/stores/${storeId}/shipping/providers`, headers)
      .then(r => setProviders(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [storeId]);

  const credentialKeys = (() => {
    if (!selected) return [];
    const n = selected.name;
    if (['Yalidine', 'Yalitec'].includes(n)) return ['id', 'token'];
    if (n === 'ZRExpress') return ['token', 'key'];
    return ['token'];
  })();

  const handleCredChange = (key, val) => {
    setCredentials(p => ({ ...p, [key]: val }));
    setTestResult(null);
  };

  const isFilled = credentialKeys.every(k => credentials[k]?.trim()) && accountName.trim();

  const handleTest = async () => {
    setIsTesting(true); setTestResult(null);
    try {
      const { data } = await axios.post(
        `${baseURL}/stores/${storeId}/shipping/settings`,
        { providerName: selected.name, credentials, accountName },
        headers,
      );
      setTestResult(data.isVerified ? 'ok' : 'fail');
    } catch { setTestResult('fail'); }
    finally { setIsTesting(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post(
        `${baseURL}/stores/${storeId}/shipping/accounts`,
        { providerName: selected.name, credentials, accountName },
        headers,
      );
      onSaved();
      onClose();
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  const filtered = providers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">{t('shipping_add_title')}</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('shipping_add_subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Provider list */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 dark:border-zinc-800 flex flex-col shrink-0">
            <div className="px-3 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 text-xs font-medium outline-none focus:border-indigo-400 transition-all ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                </div>
              ) : filtered.map(provider => (
                <ProviderCard
                  key={provider.name}
                  provider={provider}
                  isSelected={selected?.name === provider.name}
                  onSelect={p => { setSelected(p); setCredentials({}); setTestResult(null); setAccountName(p.title); }}
                />
              ))}
            </div>
          </div>

          {/* Right: credentials */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                  <Truck className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-zinc-500 font-medium">{t('shipping_select_provider')}</p>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                {/* Provider info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60">
                  {selected.logo && selected.logo !== '#' ? (
                    <img src={selected.logo} alt={selected.title} className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-gray-100 dark:border-zinc-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black text-gray-800 dark:text-white">{selected.title}</p>
                    <a href={selected.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">{selected.website}</a>
                  </div>
                </div>

                {/* Account name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">{t('shipping_account_name_label')}</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder={t('shipping_account_placeholder')}
                    className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>

                {/* Credential fields */}
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> {t('shipping_credentials')}
                  </p>
                  {credentialKeys.map(key => (
                    <CredentialField
                      key={key}
                      label={key.toUpperCase()}
                      fieldKey={key}
                      value={credentials[key] ?? ''}
                      onChange={handleCredChange}
                      isPassword={key === 'token' || key === 'key'}
                    />
                  ))}
                </div>

                {testResult && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                    testResult === 'ok'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'
                  }`}>
                    {testResult === 'ok'
                      ? <><ShieldCheck className="w-4 h-4 shrink-0" /> {t('shipping_test_success')}</>
                      : <><ShieldX className="w-4 h-4 shrink-0" /> {t('shipping_test_fail')}</>
                    }
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={handleTest}
                    disabled={!isFilled || isTesting}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {t('shipping_test_button')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isFilled || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('shipping_save_account')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shipping account card in Settings */
function AccountCard({ account, onSetDefault, onDelete, isRtl, t }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      account.isDefault
        ? 'bg-indigo-50/60 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/40'
        : 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800'
    }`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        account.isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
      }`}>
        <Truck className={`w-5 h-5 ${account.isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-gray-800 dark:text-white">{account.accountName}</p>
          {account.isDefault && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Star className="w-2.5 h-2.5" /> {t('shipping_default_badge')}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            account.isVerified
              ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'
              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
          }`}>
            {account.isVerified ? t('shipping_verified') : t('shipping_unverified')}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{account.providerName}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!account.isDefault && (
          <button
            onClick={() => onSetDefault(account.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
          >
            <Star className="w-3 h-3" /> {t('shipping_set_default')}
          </button>
        )}
        <button
          onClick={() => onDelete(account.id)}
          className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Settings Component ───────────────────────────────────────────────────

const Settings = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const [activeTab, setActiveTab] = useState('profile');
  const token = getAccessToken();
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const { user: contextUser } = useOutletContext();
  const storeId = localStorage.getItem('storeId');

  const [userData, setUserData] = useState({
    username: contextUser?.name || '',
    email: contextUser?.email || '',
    provider: '',
    topic: '',
    isNtfy: true,
  });

  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscribing, setSubscribing] = useState(null);
  const [subInterval, setSubInterval] = useState('month');
  const [subToast, setSubToast] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loadSaveChange, setLoadSaveChange] = useState(false);
  const [loadToggle, setLoadToggle] = useState(false);

  // ─── Shipping state ───────────────────────────────────────────────────────
  const [shippingAccounts, setShippingAccounts] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    if (contextUser?.name) {
      setUserData(prev => ({ ...prev, username: contextUser.name, email: contextUser.email || prev.email }));
    }
  }, [contextUser]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${baseURL}/user/current-user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUserData(prev => ({
        ...prev, provider: data.provider || '', topic: data.topic || '', isNtfy: data.isNtfy ?? prev.isNtfy,
      })))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (activeTab !== 'subscription' || subscription !== null) return;
    setSubLoading(true);
    axios.get(`${baseURL}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSubscription(r.data ?? null))
      .catch(() => setSubscription(null))
      .finally(() => setSubLoading(false));
  }, [activeTab, token, subscription]);

  useEffect(() => {
    if (activeTab !== 'subscription' || plans.length > 0) return;
    axios.get(`${baseURL}/plans?active=true`).then(r => setPlans(r.data)).catch(() => {});
  }, [activeTab, plans.length]);

  // ─── Load shipping accounts ───────────────────────────────────────────────
  const loadShippingAccounts = useCallback(async () => {
    if (!storeId) return;
    setShippingLoading(true);
    try {
      const { data } = await axios.get(`${baseURL}/stores/${storeId}/shipping/accounts`, headers);
      setShippingAccounts(data);
    } catch { setShippingAccounts([]); }
    finally { setShippingLoading(false); }
  }, [storeId, token]);

  useEffect(() => {
    if (activeTab === 'shipping') loadShippingAccounts();
  }, [activeTab, loadShippingAccounts]);

  const handleSetDefaultAccount = async (accountId) => {
    try {
      await axios.patch(`${baseURL}/stores/${storeId}/shipping/accounts/${accountId}/default`, {}, headers);
      loadShippingAccounts();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm(t('shipping_delete_confirm'))) return;
    try {
      await axios.delete(`${baseURL}/stores/${storeId}/shipping/accounts/${accountId}`, headers);
      loadShippingAccounts();
    } catch (e) { console.error(e); }
  };

  // ─── Subscription handlers ────────────────────────────────────────────────
  const handleSubscribe = async (planId, interval = 'month') => {
    setSubscribing(planId);
    try {
      await axios.post(`${baseURL}/subscription/subscribe`, { planId, interval }, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get(`${baseURL}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } });
      setSubscription(data);
      setShowSubModal(false);
      showSubToast(t('sub_success'), 'success');
    } catch (err) {
      setShowSubModal(false);
      showSubToast(err?.response?.data?.message || t('sub_error'), 'error');
    } finally { setSubscribing(null); }
  };

  const showSubToast = (msg, type = 'success') => {
    setSubToast({ msg, type });
    setTimeout(() => setSubToast(null), 3500);
  };

  const handleAutoRenew = async () => {
    const next = !subscription.autoRenew;
    setSubscription(prev => ({ ...prev, autoRenew: next }));
    try {
      await axios.patch(`${baseURL}/subscription/my/auto-renew`, { autoRenew: next }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      setSubscription(prev => ({ ...prev, autoRenew: !next }));
      showSubToast(t('sub_error'), 'error');
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleSave = async () => {
    setLoadSaveChange(true);
    try {
      await axios.patch(`${baseURL}/user`, { topic: userData.topic }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { console.error('Save error:', error); }
    finally { setLoadSaveChange(false); }
  };

  const toggleNtfy = async () => {
    setLoadToggle(true);
    try {
      const res = await axios.post(`${baseURL}/user/toggle-ntfy`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUserData({ ...userData, isNtfy: res.data });
    } catch (error) { confirm(error.response?.data.message); }
    finally { setLoadToggle(false); }
  };

  const tabs = [
    { id: 'profile', label: t('tab_profile'), icon: <User size={18} /> },
    { id: 'store', label: t('tab_preferences'), icon: <Globe size={18} /> },
    { id: 'notifications', label: t('tab_notifications'), icon: <Bell size={18} /> },
    { id: 'shipping', label: t('tab_shipping'), icon: <Truck size={18} /> },
    { id: 'subscription', label: t('tab_subscription'), icon: <CreditCard size={18} /> },
  ];

  const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:border-indigo-400 transition-all dark:text-white';
  const disabledInputCls = 'w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed text-sm';
  const SectionTitle = ({ children }) => (
    <h3 className="text-base font-black dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6">{children}</h3>
  );

  const formatDate = (d) => new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });
  const daysLeft = (endDate) => Math.max(0, Math.ceil((new Date(endDate) - new Date()) / 86400000));
  const upgradeablePlans = plans.filter(p => !isFree(p) && p.id !== subscription?.plan?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Add account modal */}
      {showAddAccount && storeId && (
        <AddAccountModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          onClose={() => setShowAddAccount(false)}
          onSaved={loadShippingAccounts}
          t={t}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl">
          <SettingsIcon size={22} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar */}
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
                : 'bg-white dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-6">

          {/* ─── Profile ─── */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <SectionTitle>{t('personal_info')}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('username')}</label>
                  <input type="text" disabled value={userData.username} className={disabledInputCls} />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('email')}</label>
                  <input type="email" disabled value={userData.email} className={disabledInputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Preferences ─── */}
          {activeTab === 'store' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <SectionTitle>{t('platform_pref')}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Globe size={14} />{t('language')}
                  </label>
                  <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="ar">{t('lang_ar')}</option>
                    <option value="en">{t('lang_en')}</option>
                    <option value="fr">{t('lang_fr')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Moon size={14} />{t('mode')}
                  </label>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl font-bold transition-all hover:border-gray-300 dark:hover:border-zinc-600"
                  >
                    <span className="text-sm dark:text-zinc-300">{isDark ? t('dark') : t('light')}</span>
                    {isDark ? <Moon size={18} className="text-yellow-400" /> : <Sun size={18} className="text-orange-500" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Notifications ─── */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                <h3 className="text-base font-black dark:text-white">{t('notif_title')}</h3>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded-full tracking-wider">Ntfy.sh</span>
              </div>
              <div className="space-y-3 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <label className="flex items-center gap-2 text-sm font-bold dark:text-zinc-300">
                  <Bell size={15} className="dark:text-white" />{t('notif_topic_label')}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={t('notif_topic_placeholder')}
                      value={userData.topic}
                      dir="ltr"
                      onChange={(e) => setUserData({ ...userData, topic: e.target.value })}
                      className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-indigo-400 dark:text-white font-mono text-sm transition-all pr-10"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={loadSaveChange}
                    className={`relative px-8 py-3 text-sm font-black rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 w-[170px] ${loadSaveChange ? 'bg-blue-400 dark:bg-blue-800/40 text-white/80 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`}
                  >
                    {loadSaveChange ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : t('save')}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {t('notif_hint')}{' '}
                  <a href="https://ntfy.sh" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5 hover:text-blue-700 transition-colors">
                    {t('notif_visit')} <ExternalLink size={10} />
                  </a>
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-1">{t('notif_send_pref')}</label>
                {loadToggle ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl border border-transparent opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                      <p className="font-bold text-sm text-gray-400">{t('notif_new_order')}</p>
                    </div>
                    <div className="w-10 h-6 flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                ) : (
                  <div onClick={toggleNtfy} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full bg-emerald-500 transition-opacity ${userData.isNtfy ? 'opacity-100' : 'opacity-30'}`} />
                      <p className={`font-bold text-sm transition-all ${userData.isNtfy ? 'dark:text-white text-gray-800' : 'text-gray-400 line-through'}`}>{t('notif_new_order')}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${userData.isNtfy ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${userData.isNtfy ? (isRtl ? 'right-5' : 'left-5') : (isRtl ? 'right-1' : 'left-1')}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Shipping Accounts ─── */}
          {activeTab === 'shipping' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                <div>
                  <h3 className="text-base font-black dark:text-white flex items-center gap-2">
                    <Truck size={16} className="text-indigo-500" /> {t('shipping_accounts_title')}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('shipping_accounts_subtitle')}</p>
                </div>
                {storeId && (
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    <Plus size={15} /> {t('shipping_add_account')}
                  </button>
                )}
              </div>

              {!storeId ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <ShieldX className="w-7 h-7 text-amber-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{t('shipping_no_store_message')}</p>
                </div>
              ) : shippingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : shippingAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <Plug className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-white">{t('shipping_empty_title')}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t('shipping_empty_subtitle')}</p>
                  </div>
                  <button
                    onClick={() => setShowAddAccount(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    <Plus size={15} /> {t('shipping_add_first_account')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingAccounts.map(account => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      isRtl={isRtl}
                      onSetDefault={handleSetDefaultAccount}
                      onDelete={handleDeleteAccount}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Subscription ─── */}
          {activeTab === 'subscription' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <SectionTitle>{t('tab_subscription')}</SectionTitle>

              {subLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
              ) : !subscription ? (
                <div className="space-y-5">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{t('sub_no_plan_hint')}</p>
                  {plans.length === 0
                    ? <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-8">{t('sub_no_available_plans')}</p>
                    : (
                      <div className="space-y-3">
                        {plans.map(plan => {
                          const price = getPlanPrice(plan, 'month');
                          return (
                            <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                                  <Zap size={16} className="text-indigo-500" />
                                </div>
                                <div>
                                  <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                                    {isFree(plan)
                                      ? <span className="font-bold text-emerald-500">{t('free')}</span>
                                      : <><span className="font-bold text-gray-700 dark:text-zinc-300">{price.toLocaleString()} {plan.currency}</span> / {t('sub_monthly')}</>
                                    }
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSubscribe(plan.id, 'month')}
                                disabled={!!subscribing}
                                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                              >
                                {subscribing === plan.id ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                                {t('sub_activate')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )
                  }
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Zap size={20} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-black text-lg text-gray-900 dark:text-white leading-tight">{subscription.plan.name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                          {subscription.interval === 'month' ? t('sub_monthly') : t('sub_annual')}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-full">
                      <CheckCircle2 size={12} /> {t('sub_active')}
                    </span>
                  </div>

                  <div className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t('sub_price')}</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {isFree(subscription.plan)
                          ? <span className="text-emerald-500">{t('free')}</span>
                          : <>{getPlanPrice(subscription.plan, subscription.interval).toLocaleString()}<span className="text-sm font-medium text-gray-400 dark:text-zinc-500 ms-1">{subscription.plan.currency} / {subscription.interval === 'year' ? t('sub_annual_short') : t('sub_monthly_short')}</span></>
                        }
                      </p>
                      {isFree(subscription.plan) && upgradeablePlans.length > 0 && (
                        <button onClick={() => setShowSubModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 shrink-0">
                          <Zap size={13} /> {t('sub_upgrade')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: t('sub_start_date'), value: formatDate(subscription.startDate) }, { label: t('sub_end_date'), value: formatDate(subscription.endDate) }].map(item => (
                      <div key={item.label} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CalendarDays size={11} /> {item.label}</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const total = new Date(subscription.endDate) - new Date(subscription.startDate);
                    const elapsed = new Date() - new Date(subscription.startDate);
                    const pct = Math.min(100, Math.round((elapsed / total) * 100));
                    const left = daysLeft(subscription.endDate);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-zinc-500">
                          <span>{t('sub_days_left')}</span>
                          <span className={left <= 7 ? 'text-red-400' : 'text-emerald-500'}>{left} {t('sub_days')}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {subscription.plan.features && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t('sub_features')}</p>
                      <div className="flex flex-wrap gap-2">
                        {buildFeatureSummary(subscription.plan.features, t).map(({ icon: Icon, text }) => (
                          <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl">
                            <Icon size={11} /> {text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isFree(subscription.plan) && (
                    <div onClick={handleAutoRenew} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer">
                      <div>
                        <p className="font-black text-sm text-gray-800 dark:text-white">{t('sub_auto_renew')}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{subscription.autoRenew ? t('sub_auto_renew_on') : t('sub_auto_renew_off')}</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${subscription.autoRenew ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${subscription.autoRenew ? (isRtl ? 'right-6' : 'left-6') : (isRtl ? 'right-1' : 'left-1')}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {subToast && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold mt-2 ${subToast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                  {subToast.type === 'success' ? <CheckCircle2 size={15} /> : <span>✕</span>}
                  {subToast.msg}
                </div>
              )}
            </div>
          )}

          {/* ── Upgrade Modal ── */}
          {showSubModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowSubModal(false); }}>
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><Zap size={15} className="text-indigo-500" /></div>
                    <h2 className="font-black text-gray-900 dark:text-white text-base">{t('sub_upgrade')}</h2>
                  </div>
                  <button onClick={() => setShowSubModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-lg font-bold">✕</button>
                </div>
                <p className="px-6 pb-2 text-xs text-gray-400 dark:text-zinc-500">{t('sub_current_label')}: <span className="font-bold text-gray-600 dark:text-zinc-300">{subscription?.plan?.name}</span></p>
                <div className="px-6 pb-4">
                  <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
                    {['month', 'year'].map(iv => (
                      <button key={iv} onClick={() => setSubInterval(iv)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${subInterval === iv ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>
                        {iv === 'month' ? t('sub_monthly') : t('sub_annual')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-3">
                  {upgradeablePlans.map(plan => {
                    const price = getPlanPrice(plan, subInterval);
                    const savings = plan.monthlyPrice > 0 ? Math.round((1 - Number(plan.yearlyPrice) / (Number(plan.monthlyPrice) * 12)) * 100) : 0;
                    const featureRows = buildFeatureSummary(plan.features, t);
                    return (
                      <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                        <div>
                          <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5"><span className="font-bold text-gray-700 dark:text-zinc-300">{price.toLocaleString()} {plan.currency}</span>{' / '}{subInterval === 'month' ? t('sub_monthly') : t('sub_annual')}</p>
                          {subInterval === 'year' && savings > 0 && <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{t('save_pct', { pct: savings })}</p>}
                          {featureRows.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {featureRows.slice(0, 3).map(({ icon: Icon, text }) => (
                                <span key={text} className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg font-semibold inline-flex items-center gap-1"><Icon size={9} /> {text}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleSubscribe(plan.id, subInterval)} disabled={!!subscribing} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl active:scale-95 disabled:opacity-50 transition-all shrink-0 ms-3">
                          {subscribing === plan.id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                          {t('sub_activate')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;