import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Truck, Shield, ShieldCheck, ShieldX, Loader2, Save } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import ProviderCard from './ProviderCard';
import CredentialField from './CredentialField';

/** Modal for adding a new shipping account */
export default function AddAccountModal({ storeId, headers, isRtl, onClose, onSaved, t }) {
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
