import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  PhoneCall, Search, Bookmark, BookmarkCheck, Trash2, MapPin, Phone, Loader2, Info, Wallet,
} from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import NoStoreState from '../../../components/NoStoreState';

const WAITING = ['pending', 'appl1', 'appl2', 'appl3', 'postponed'];

function CompanyCard({ company, t, children, stats }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-gray-900 dark:text-white truncate">{company.name}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {company.wilaya && <span className="flex items-center gap-1"><MapPin size={12} />{company.wilaya.ar_name}</span>}
            <span className="flex items-center gap-1" dir="ltr"><Phone size={12} />{company.phone}</span>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black">
          {t('commission', { amount: company.commissionPerDelivered })}
        </span>
      </div>
      {company.description && <p className="text-sm text-gray-600 dark:text-zinc-300 line-clamp-3 whitespace-pre-line">{company.description}</p>}
      {stats}
      <div className="flex items-center gap-2 mt-auto pt-1">{children}</div>
    </div>
  );
}

export default function Confirmation() {
  const { t } = useTranslation('translation', { keyPrefix: 'confirmation' });
  const storeId = localStorage.getItem('storeId');
  const headers = { Authorization: `Bearer ${getAccessToken()}` };

  const [tab, setTab] = useState('saved');
  const [saved, setSaved] = useState(null);
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [wilayas, setWilayas] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const loadSaved = useCallback(async () => {
    try {
      const { data } = await axios.get(`${baseURL}/stores/${storeId}/confirmation/saved`, { headers });
      setSaved(data);
    } catch (err) {
      console.error(err);
      toast.error(t('load_error'));
      setSaved([]);
    }
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadResults = useCallback(async () => {
    setResults(null);
    try {
      const { data } = await axios.get(`${baseURL}/confirmation/directory`, {
        headers,
        params: { search: search || undefined, wilayaId: wilayaId || undefined, storeId },
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      toast.error(t('load_error'));
      setResults([]);
    }
  }, [search, wilayaId, storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (storeId) loadSaved(); }, [storeId, loadSaved]);
  useEffect(() => {
    axios.get(`${baseURL}/shipping/wilayas`).then(({ data }) => setWilayas(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (tab !== 'search' || !storeId) return undefined;
    const timer = setTimeout(loadResults, 300); // انتظار توقف الكتابة
    return () => clearTimeout(timer);
  }, [tab, loadResults, storeId]);

  const save = async (company) => {
    setBusyId(company.id);
    try {
      await axios.post(`${baseURL}/stores/${storeId}/confirmation/saved/${company.id}`, {}, { headers });
      setResults((r) => r?.map((c) => (c.id === company.id ? { ...c, saved: true } : c)));
      loadSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || t('load_error'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (company) => {
    if (!window.confirm(t('remove_confirm', { name: company.name }))) return;
    setBusyId(company.id);
    try {
      await axios.delete(`${baseURL}/stores/${storeId}/confirmation/saved/${company.id}`, { headers });
      setSaved((s) => s.filter((c) => c.id !== company.id));
      setResults((r) => r?.map((c) => (c.id === company.id ? { ...c, saved: false } : c)));
    } catch (err) {
      toast.error(err.response?.data?.message || t('load_error'));
    } finally {
      setBusyId(null);
    }
  };

  if (!storeId) return <NoStoreState />;

  const statsOf = (orders = {}) => {
    const sum = (keys) => keys.reduce((s, k) => s + (orders[k] || 0), 0);
    const items = [
      [t('stats_waiting'), sum(WAITING), 'text-amber-600'],
      [t('stats_confirmed'), sum(['confirmed', 'shipping']), 'text-blue-600'],
      [t('stats_delivered'), sum(['delivered']), 'text-emerald-600'],
      [t('stats_cancelled'), sum(['cancelled', 'returned']), 'text-rose-600'],
    ];
    return (
      <div className="grid grid-cols-4 gap-2 text-center">
        {items.map(([label, value, cls]) => (
          <div key={label} className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 py-2">
            <p className={`text-lg font-black tabular-nums ${cls}`}>{value}</p>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold">{label}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <PhoneCall size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xl">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 self-start">
          {[['saved', t('tab_saved'), Bookmark], ['search', t('tab_search'), Search]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === key ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-zinc-400'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* كيف يعمل */}
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-black text-indigo-900 dark:text-indigo-300 mb-2"><Info size={15} />{t('how_title')}</p>
        <ol className="list-decimal ps-5 space-y-1 text-gray-700 dark:text-zinc-300">
          {['how_1', 'how_2', 'how_3', 'how_4'].map((k) => <li key={k}>{t(k)}</li>)}
        </ol>
        <p className="flex items-center gap-2 mt-3 text-xs font-bold text-amber-700 dark:text-amber-400">
          <Wallet size={13} />{t('wallet_note')}
          <Link to="/dashboard/wallet" className="underline">{t('wallet_link')}</Link>
        </p>
      </div>

      {tab === 'saved' && (
        saved === null ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : saved.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('empty_saved')}</p>
            <button onClick={() => setTab('search')} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">
              {t('go_search')}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((c) => (
              <CompanyCard key={c.id} company={c} t={t} stats={statsOf(c.orders)}>
                <button onClick={() => remove(c)} disabled={busyId === c.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 disabled:opacity-50">
                  {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}{t('remove')}
                </button>
              </CompanyCard>
            ))}
          </div>
        )
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_placeholder')}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-indigo-400 dark:text-white" />
            </div>
            <select value={wilayaId} onChange={(e) => setWilayaId(e.target.value)}
              className="sm:w-56 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none dark:text-white dark:[color-scheme:dark]">
              <option value="">{t('all_wilayas')}</option>
              {wilayas.map((w) => <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>)}
            </select>
          </div>

          {results === null ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-500" /></div>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-16">{t('empty_search')}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((c) => (
                <CompanyCard key={c.id} company={c} t={t}>
                  {c.saved ? (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10">
                      <BookmarkCheck size={14} />{t('saved')}
                    </span>
                  ) : (
                    <button onClick={() => save(c)} disabled={busyId === c.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                      {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={14} />}{t('save')}
                    </button>
                  )}
                </CompanyCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
