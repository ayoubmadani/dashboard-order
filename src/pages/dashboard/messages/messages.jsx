import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RefreshCcw, AlertTriangle, Phone, Mail, Store as StoreIcon,
  CheckCircle2, MessageSquareText, Trash2, Archive, Eye,
  Inbox, Search, X, ArchiveRestore
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { LayoutGrid } from 'lucide-react';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl ${className}`} />
);

function useCopy() {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => { });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  return { copiedKey, copy };
}

function fmt(dateStr, language = "ar") {
  const locales = { ar: 'ar-DZ', en: 'en-US', fr: 'fr-FR' };
  const locale = locales[language] || locales.ar;
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
//  Message Card Component
// ─────────────────────────────────────────────
function MessageCard({ msg, activeTab, onDelete, onArchive, onView }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'message' });
  const { copiedKey, copy } = useCopy();

  const initial = msg.name?.charAt(0)?.toUpperCase() || '?';
  const hue = [...(msg.name || '')].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;

  return (
    <div className={`relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all p-5 space-y-4 group ${!msg.isViewed
      ? 'border-indigo-100 dark:border-indigo-500/30 shadow-sm shadow-indigo-50/50'
      : 'border-gray-100 dark:border-zinc-800'
      }`}>

      {!msg.isViewed && (
        <span className="absolute top-4 ltr:right-4 rtl:left-4 flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
            style={{ background: `hsl(${hue},65%,55%)` }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 dark:text-white truncate">{msg.name}</p>
            {msg.store && (
              <div className="flex items-center gap-1 mt-0.5">
                {msg.store.design?.logoUrl ? (
                  <img src={msg.store.design.logoUrl} alt={msg.store.name} className="w-4 h-4 rounded object-cover shrink-0" />
                ) : (
                  <StoreIcon size={11} className="text-indigo-400 shrink-0" />
                )}
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                  {msg.store.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {msg.createdAt && (
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 shrink-0 mt-0.5 font-medium" dir="ltr">
            {fmt(msg.createdAt, i18n.language)}
          </span>
        )}
      </div>

      <p className={`text-sm leading-relaxed bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-zinc-700 line-clamp-3 group-hover:line-clamp-none transition-all ${!msg.isViewed ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-zinc-300'
        }`}>
        {msg.message}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {msg.phone && (
          <button
            onClick={() => copy(msg.phone, `phone-${msg.id}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${copiedKey === `phone-${msg.id}`
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-100 dark:border-zinc-700 hover:border-gray-300'
              }`}
            dir="ltr"
          >
            {copiedKey === `phone-${msg.id}` ? <CheckCircle2 size={12} /> : <Phone size={12} />}
            {msg.phone}
          </button>
        )}
        {msg.email && (
          <button
            onClick={() => copy(msg.email, `email-${msg.id}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${copiedKey === `email-${msg.id}`
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
              : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-100 dark:border-zinc-700 hover:border-gray-300'
              }`}
          >
            {copiedKey === `email-${msg.id}` ? <CheckCircle2 size={12} /> : <Mail size={12} />}
            {msg.email}
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 dark:border-zinc-800">
        {!msg.isViewed && (
          <button
            onClick={() => onView?.(msg.id)}
            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            title={t('mark_as_viewed')}
          >
            <Eye size={18} />
          </button>
        )}

        <button
          onClick={() => onArchive?.(msg.id)}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'archive'
            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }`}
          title={activeTab === 'archive' ? t('unarchive') : t('archive')}
        >
          {activeTab === 'archive' ? <ArchiveRestore size={18} /> : <Archive size={18} />}
        </button>

        <button
          onClick={() => onDelete?.(msg.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title={t('delete')}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function Messages() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'message' });
  const isRtl = i18n.dir() === 'rtl';
  const headers = useAuthHeaders();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'archive'
  const [filter, setFilter] = useState('');

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      // تجهيز البارامترات بناءً على التبويب النشط
      const params = {
        archive: activeTab === 'archive', // true فقط للأرشيف
        filter: filter || undefined,
        nb: "1"
      };

      // إضافة بارامتر viewed بناءً على التبويب
      if (activeTab === 'viewed') {
        params.viewed = 'true';
      } else if (activeTab === 'inbox') {
        params.viewed = 'false'; // لجلب الرسائل الجديدة فقط (غير المقروءة)
      }
      // في حالة تبويب 'all'، لا نرسل بارامتر viewed لجلب الكل

      const { data } = await axios.get(`${baseURL}/user/message-user`, {
        ...headers,
        params
      });

      const result = Array.isArray(data) ? data : data.data ?? [];
      setMessages(result);

    } catch (err) {
      setError(t('error'));
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, filter, headers, t]);

  useEffect(() => {
    fetchMessages();
  }, [activeTab]); // Fetch when tab changes

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMessages();
  };

  const handleView = async (id) => {
    try {
      await axios.patch(`${baseURL}/user/message-user/${id}/view`, {}, headers);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isViewed: true } : m));
    } catch (err) { console.error(err); }
  };

  const handleArchive = async (id) => {
    try {
      const newState = activeTab === 'inbox'; // if inbox -> archive it (true)
      await axios.patch(`${baseURL}/user/message-user/${id}/archive?state=${newState}`, {}, headers);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await axios.delete(`${baseURL}/user/message-user/${id}`, headers);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto space-y-6 font-sans py-10 px-4 animate-in fade-in duration-500">

      {/* --- Header --- */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <MessageSquareText size={22} />
            </div>
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
        </div>

        <button
          onClick={() => fetchMessages(true)}
          disabled={refreshing}
          className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* --- Search Bar --- */}
      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-4 rtl:right-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full ltr:pl-12 rtl:pr-12 pr-12 py-3.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
        />
        {filter && (
          <button
            type="button"
            onClick={() => { setFilter(''); fetchMessages(); }}
            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-400"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* --- Tabs --- */}
      <div className="flex p-1 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar shadow-inner">
        {[
          
          { id: 'inbox', label: t('tabs.inbox'), icon: <Inbox size={16} /> },
          { id: 'viewed', label: t('tabs.viewed'), icon: <Eye size={16} /> },
          { id: 'archive', label: t('tabs.archive'), icon: <Archive size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-200/50 dark:hover:bg-zinc-700/50'
              }
            `}
          >
            <span className={`${activeTab === tab.id ? 'animate-in zoom-in duration-300' : ''}`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- List Content --- */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
          <div className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-full mb-4 text-gray-300">
            {/* أيقونة ديناميكية حسب التبويب */}
            {activeTab === 'archive' ? <Archive size={32} /> :
              activeTab === 'viewed' ? <Eye size={32} /> :
                activeTab === 'all' ? <LayoutGrid size={32} /> : <Inbox size={32} />}
          </div>
          <h3 className="text-sm font-black text-gray-600 dark:text-zinc-400">
            {t(`empty_${activeTab}`)}
          </h3>
          <p className="text-xs text-gray-400 mt-2 max-w-[240px] leading-relaxed">
            {t(`empty_${activeTab}_desc`)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {messages.map(msg => (
            <MessageCard
              key={msg.id}
              msg={msg}
              activeTab={activeTab}
              onView={handleView}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}