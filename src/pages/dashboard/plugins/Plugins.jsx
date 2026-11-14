import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Puzzle, Search, Plus, Truck, CheckCircle2, Loader2, ShieldX, RotateCw } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { pluginCards } from '../../../utils/pluginCards';
import AddAccountModal from '../settings/components/AddAccountModal';
import ProviderLogo from '../settings/components/ProviderLogo';

/** «الإضافات»: شركات التوصيل كبطاقات، وزر «إضافة» يفتح نموذج الربط على الشركة المختارة */
export default function Plugins() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const isRtl = i18n.dir() === 'rtl';
  const token = getAccessToken();
  const headers = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const storeId = localStorage.getItem('storeId');

  const [providers, setProviders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(null); // اسم الشركة المفتوح نموذجها

  const loadAccounts = useCallback(async () => {
    if (!storeId) return;
    try {
      const { data } = await axios.get(`${baseURL}/stores/${storeId}/shipping/accounts`, headers);
      setAccounts(Array.isArray(data) ? data : []);
    } catch { setAccounts([]); }
  }, [storeId, headers]);

  const load = useCallback(async () => {
    if (!storeId) { setIsLoading(false); return; }
    setIsLoading(true); setLoadError(false);
    try {
      const [{ data }] = await Promise.all([
        axios.get(`${baseURL}/stores/${storeId}/shipping/providers`, headers),
        loadAccounts(),
      ]);
      setProviders(Array.isArray(data) ? data : []);
    } catch { setLoadError(true); }
    finally { setIsLoading(false); }
  }, [storeId, headers, loadAccounts]);

  useEffect(() => { load(); }, [load]);

  const cards = pluginCards(providers, accounts, { query, filter });
  const connectedCount = pluginCards(providers, accounts, { filter: 'connected' }).length;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {adding && storeId && (
        <AddAccountModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          initialProvider={adding}
          onClose={() => setAdding(null)}
          onSaved={loadAccounts}
          t={t}
        />
      )}

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Puzzle className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('plugins_title')}</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('plugins_subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className={`w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>
          <div className="flex gap-1 p-1 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 self-start sm:self-auto">
            {[
              ['all', `${t('plugins_filter_all')} (${providers.length})`],
              ['connected', `${t('plugins_filter_connected')} (${connectedCount})`],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  filter === id
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!storeId ? (
        <Notice icon={<ShieldX className="w-7 h-7 text-amber-400" />} text={t('shipping_no_store_message')} />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : loadError ? (
        <Notice icon={<ShieldX className="w-7 h-7 text-rose-400" />} text={t('plugins_load_error')}>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all"
          >
            <RotateCw className="w-4 h-4" /> {t('plugins_retry')}
          </button>
        </Notice>
      ) : cards.length === 0 ? (
        <Notice
          icon={<Truck className="w-7 h-7 text-gray-300 dark:text-zinc-600" />}
          text={filter === 'connected' && !query.trim() ? t('plugins_empty_connected') : t('plugins_empty')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map(({ provider, accounts: linked, connected }) => (
            <article
              key={provider.name}
              className={`flex flex-col p-5 rounded-2xl border bg-white dark:bg-zinc-900 transition-all hover:shadow-lg hover:shadow-indigo-500/5 ${
                connected ? 'border-emerald-200 dark:border-emerald-800/40' : 'border-gray-100 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <ProviderLogo logo={provider.logo} box="w-12 h-12 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-black text-gray-900 dark:text-white truncate">{provider.title || provider.name}</h2>
                  {connected && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> {t('plugins_connected')}
                    </span>
                  )}
                </div>
              </div>

              {provider.description && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mt-3 line-clamp-2">{provider.description}</p>
              )}

              {connected && (
                <ul className="mt-3 space-y-1">
                  {linked.map((a) => (
                    <li key={a.id} className="text-xs font-semibold text-gray-600 dark:text-zinc-300 truncate">
                      • {a.accountName || a.providerName}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-4">
              <button
                onClick={() => setAdding(provider.name)}
                className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  connected
                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                }`}
              >
                <Plus className="w-4 h-4" /> {connected ? t('plugins_add_another') : t('plugins_add')}
              </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Notice({ icon, text, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">{icon}</div>
      <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{text}</p>
      {children}
    </div>
  );
}
