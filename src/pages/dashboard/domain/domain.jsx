import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe, Copy, CheckCircle2, Loader2, Trash2,
  RefreshCcw, ShieldCheck, ExternalLink, Info, Plus
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { Zap } from 'lucide-react';

// ─────────────────────────────────────────────
//  Constants — shared for ALL domains
// ─────────────────────────────────────────────
const DNS_RECORD = {
  type: 'CNAME',
  host: '@',
  value: 'mdstore.top',
  ttl: 'Auto',
};

function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-xl ${className}`} />
);

// ─────────────────────────────────────────────
//  Copy cell
// ─────────────────────────────────────────────
function CopyCell({ label, value, mono = true }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-xl">
        <span className={`flex-1 text-sm font-bold text-gray-800 dark:text-zinc-100 truncate ${mono ? 'font-mono' : ''}`}>
          {value}
        </span>
        <button
          onClick={copy}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${copied
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
        >
          {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
          {copied ? t('copied') : t('copy')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Static DNS Card
// ─────────────────────────────────────────────
function DnsCard() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });

  return (
    <div className="bg-indigo-50/60 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-indigo-100 dark:border-indigo-500/20">
        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
          <Globe size={15} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('dns_section_title')}</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('dns_section_desc')}</p>
        </div>
      </div>

      {/* Record grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <CopyCell label={t('dns_type')} value={DNS_RECORD.type} mono />
        <CopyCell label={t('dns_host')} value={DNS_RECORD.host} mono />
        <CopyCell label={t('dns_value')} value={DNS_RECORD.value} mono />
        <CopyCell label={t('dns_ttl')} value={DNS_RECORD.ttl} mono={false} />
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 px-5 pb-4">
        <Info size={11} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">{t('dns_note')}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Domain Row
// ─────────────────────────────────────────────
function DomainRow({ domain, onDelete, onSync }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const active = domain.isActive;

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(domain.domain).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    await onSync(domain.id);
    setSyncing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(t('confirm_delete'))) return;
    setDeleting(true);
    await onDelete(domain.id);
    setDeleting(false);
  };

  const isSub = domain.domain.endsWith('.mdstore.top');

  // مصفوفة الألوان لتسهيل القراءة
  const statusColors = isSub
    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
    : active
      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-100 dark:border-emerald-800'
      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-400 border-amber-100 dark:border-amber-800';

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-zinc-900 rounded-2xl border ${isSub ? 'border-blue-100 dark:border-blue-900/30' : 'border-gray-100 dark:border-zinc-800'} shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all group`}>

      {/* Status icon container */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSub ? 'bg-blue-100/50 dark:bg-blue-900/30' : active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
        }`}>
        <Globe className={`w-4.5 h-4.5 ${isSub ? 'text-blue-600 dark:text-blue-400' : active ? 'text-emerald-500' : 'text-amber-400'
          }`} size={18} />
      </div>

      {/* Domain + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <a
            href={`https://${domain.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`group/link inline-flex items-center gap-1 text-sm font-black font-mono transition-colors ${isSub ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
              }`}
          >
            {domain.domain}
            <ExternalLink size={11} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
          </a>

          <button
            onClick={(e) => { e.stopPropagation(); copy(); }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-blue-500"
            title={copied ? t('copied') : t('copy')}
          >
            {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSub ? 'bg-blue-500' : active ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`} />
          <span className={`text-[10px] font-bold uppercase tracking-tight ${isSub ? 'text-blue-500' : 'text-gray-400 dark:text-zinc-500'
            }`}>
            {isSub ? t('system_domain') : active ? t('status_active') : t('status_pending')}
          </span>
          {active && !isSub && <ShieldCheck size={11} className="text-emerald-500" />}
          {isSub && <Zap size={11} className="text-blue-500" />} {/* أيقونة إضافية للدومين الفرعي */}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isSub && ( // إخفاء زر الفحص للدومينات الفرعية لأنها دائماً مربوطة
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl text-xs font-bold border border-gray-100 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
            <span className="hidden sm:inline">{syncing ? t('checking') : t('check_btn')}</span>
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
          title={t('delete')}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────
export default function Domain() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });
  const isRtl = i18n.dir() === 'rtl';
  const headers = useAuthHeaders();
  const storeId = localStorage.getItem('storeId');

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputDomain, setInputDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [inputError, setInputError] = useState(null);

  /* ── Fetch ── */
  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    axios.get(`${baseURL}/domain/store/${storeId}`, headers)
      .then(r => setDomains(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storeId]);

  /* ── Add ── */
  const handleAdd = async () => {
    const val = inputDomain.trim().toLowerCase();
    if (!val) return;
    setInputError(null);
    setAdding(true);
    try {
      const { data } = await axios.post(`${baseURL}/domain`, { domain: val, storeId }, headers);
      setDomains(prev => [data, ...prev]);
      setInputDomain('');
    } catch (err) {
      setInputError(err?.response?.data?.message || t('add_error'));
    } finally {
      setAdding(false);
    }
  };

  /* ── Sync ── */
  const handleSync = async (id) => {
    try {
      const { data } = await axios.patch(`${baseURL}/domain/sync/${id}`, {}, headers);
      if (data.isActive)
        setDomains(prev => prev.map(d => d.id === id ? { ...d, isActive: true } : d));
    } catch (err) { console.error(err); }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    const storeId = localStorage.getItem('storeId');
    try {
      // ندمج كل شيء في الوسيط الثاني (config)
      await axios.post(`${baseURL}/domain/delete/${id}`, {storeId} , headers);

      setDomains(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err.response.data.message);
      
    }
  };

  // ── Render ──────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="mx-auto space-y-5 font-sans animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Globe size={22} />
          </div>
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
      </div>

      {/* ── Static DNS card ── */}
      <DnsCard />

      {/* ── Add input ── */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          {t('add_label')}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Globe className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={inputDomain}
              onChange={e => { setInputDomain(e.target.value.toLowerCase()); setInputError(null); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={t('add_placeholder')}
              dir="ltr"
              className={`w-full py-2.5 bg-white dark:bg-zinc-900 border rounded-xl outline-none font-mono text-sm text-gray-900 dark:text-white placeholder:text-gray-400 transition-all shadow-sm ${inputError ? 'border-red-400' : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'
                } ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !inputDomain.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 shadow-lg text-sm"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {adding ? t('adding') : t('add_btn')}
          </button>
        </div>
        {inputError && <p className="text-xs text-red-500 font-medium">{inputError}</p>}
      </div>

      {/* ── Domain list ── */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          {t('domains_title')}
        </label>

        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl text-center">
            <Globe size={36} className="text-gray-200 dark:text-zinc-700 mb-2" />
            <p className="text-sm font-bold text-gray-400 dark:text-zinc-600">{t('empty_title')}</p>
            <p className="text-xs text-gray-300 dark:text-zinc-700 mt-0.5">{t('empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {domains.map(d => (
              <DomainRow
                key={d.id}
                domain={d}
                onDelete={handleDelete}
                onSync={handleSync}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}