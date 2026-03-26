import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Globe, Plus, Copy, CheckCircle2, XCircle, Clock,
    Loader2, Trash2, RefreshCcw, ShieldCheck, ShieldAlert,
    AlertTriangle, ChevronRight, ExternalLink, Server, Zap
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const NAMESERVERS = ['ns1.mdstore.top', 'ns2.mdstore.top'];

const DOMAIN_REGEX =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

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

function StatusBadge({ status, ssl }) {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });

    const map = {
        active: { label: t('status_active'), icon: CheckCircle2, cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' },
        pending: { label: t('status_pending'), icon: Clock, cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' },
        error: { label: t('status_error'), icon: XCircle, cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30' },
    };
    const sslMap = {
        active: { label: t('ssl_active'), icon: ShieldCheck, cls: 'text-emerald-500' },
        pending: { label: t('ssl_pending'), icon: ShieldAlert, cls: 'text-amber-500' },
        initializing: { label: t('ssl_initializing'), icon: ShieldAlert, cls: 'text-gray-400' },
    };

    const s = map[status] || map.pending;
    const sslS = sslMap[ssl] || sslMap.initializing;
    const Icon = s.icon;
    const SslIcon = sslS.icon;

    return (
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${s.cls}`}>
                <Icon className="w-3 h-3" />
                {s.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${sslS.cls}`}>
                <SslIcon className="w-3 h-3" />
                {sslS.label}
            </span>
        </div>
    );
}

// ─────────────────────────────────────────────
//  NS Copy Card
// ─────────────────────────────────────────────
function NameserverCard() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });
    const [copiedNs, setCopiedNs] = useState(null);

    const copyNs = (ns) => {
        navigator.clipboard.writeText(ns).catch(() => { });
        setCopiedNs(ns);
        setTimeout(() => setCopiedNs(null), 2000);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-gray-50 dark:border-zinc-800">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Server className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('nameservers_title')}</h3>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 leading-relaxed">{t('nameservers_desc')}</p>
                </div>
            </div>

            {/* NS rows */}
            <div className="p-4 space-y-2.5">
                {NAMESERVERS.map((ns, i) => (
                    <div key={ns} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-700">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">
                            {i + 1}
                        </span>
                        <code className="flex-1 text-sm font-mono font-semibold text-gray-800 dark:text-zinc-200">{ns}</code>
                        <button
                            onClick={() => copyNs(ns)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedNs === ns
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-white dark:bg-zinc-700 text-gray-500 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600'
                                }`}
                        >
                            {copiedNs === ns ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedNs === ns ? t('ns_copied') : t('ns_copy')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 px-4 pb-4 pt-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">{t('ns_note')}</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  Domain Row
// ─────────────────────────────────────────────
function DomainRow({ domain, onDelete, onCheckStatus }) {
    const { t } = useTranslation('domain');
    const [checking, setChecking] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [statusData, setStatusData] = useState(null);

    const handleCheck = async () => {
        setChecking(true);
        const result = await onCheckStatus(domain.domain);
        if (result) setStatusData(result);
        setChecking(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(t('confirm_delete'))) return;
        setDeleting(true);
        await onDelete(domain.id);
        setDeleting(false);
    };

    const status = statusData?.status || (domain.isActive ? 'active' : 'pending');
    const ssl = statusData?.sslStatus || 'initializing';

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">

                {/* Icon + domain */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : status === 'error'
                                ? 'bg-red-50 dark:bg-red-900/20'
                                : 'bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                        <Globe className={`w-5 h-5 ${status === 'active' ? 'text-emerald-500' :
                                status === 'error' ? 'text-red-500' : 'text-amber-500'
                            }`} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-gray-900 dark:text-white font-mono">{domain.domain}</span>
                            <a
                                href={`https://${domain.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-indigo-500 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                        <div className="mt-1.5">
                            <StatusBadge status={status} ssl={ssl} />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleCheck}
                        disabled={checking}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all border border-gray-100 dark:border-zinc-700 disabled:opacity-50"
                    >
                        {checking
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCcw className="w-3.5 h-3.5" />}
                        {checking ? t('checking') : t('check_status')}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100 dark:border-rose-500/20 disabled:opacity-50"
                        title={t('delete')}
                    >
                        {deleting
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Pending guide strip */}
            {status === 'pending' && (
                <div className="flex items-center gap-2 px-5 pb-4 pt-0">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-amber-400 rounded-full animate-pulse" />
                    </div>
                    <p className="text-[10px] text-amber-500 font-semibold shrink-0">
                        {t('verify_desc')}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function Domain() {
    const { t, i18n } = useTranslation('translation', { keyPrefix: 'domain' });

    const isRtl = i18n.dir() === 'rtl';
    const headers = useAuthHeaders();
    const storeId = localStorage.getItem('storeId');

    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inputDomain, setInputDomain] = useState('');
    const [inputError, setInputError] = useState(null);
    const [adding, setAdding] = useState(false);
    const [addedToast, setAddedToast] = useState(false);

    /* ── Fetch domains ── */
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`${baseURL}/domain/store/${storeId}`, headers);
                setDomains(Array.isArray(data) ? data : data.data ?? []);
            } catch (err) {
                // endpoint may not exist yet — show empty gracefully
                if (err.response?.status === 404) setDomains([]);
                else setError(t('error_fetch'));
            } finally {
                setLoading(false);
            }
        };
        if (storeId) fetch();
    }, [storeId]);

    /* ── Add domain ── */
    const handleAdd = async () => {
        const val = inputDomain.trim().toLowerCase();
        if (!DOMAIN_REGEX.test(val)) { setInputError(t('error_invalid')); return; }
        setInputError(null);
        setAdding(true);
        try {
            const { data } = await axios.post(
                `${baseURL}/domain`,
                { domain: val, storeId, isActive: false },
                headers
            );
            setDomains(prev => [data, ...prev]);
            setInputDomain('');
            setAddedToast(true);
            setTimeout(() => setAddedToast(false), 3000);
        } catch (err) {
            setInputError(err?.response?.data?.message || t('error_add'));
        } finally {
            setAdding(false);
        }
    };

    /* ── Delete domain ── */
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${baseURL}/domain/${id}`, headers);
            setDomains(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    /* ── Check status ── */
    const handleCheckStatus = async (hostname) => {
        try {
            const { data } = await axios.get(`${baseURL}/domain/status/${hostname}`, headers);
            return data;
        } catch {
            return null;
        }
    };

    // ── Render ──────────────────────────────────
    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6 font-sans animate-in fade-in duration-500">

            {/* ── Toast ── */}
            {addedToast && (
                <div className={`fixed top-5 ${isRtl ? 'left-5' : 'right-5'} z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {t('added_success')}
                </div>
            )}

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <Globe size={22} />
                        </div>
                        {t('title')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-3 py-2 rounded-xl shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono">*.mdstore.top</span>
                </div>
            </div>

            {/* ── Add domain input ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                    {t('add_domain')}
                </label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Globe className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
                        <input
                            type="text"
                            value={inputDomain}
                            onChange={e => { setInputDomain(e.target.value); setInputError(null); }}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder={t('add_placeholder')}
                            dir="ltr"
                            className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-950 border rounded-xl outline-none transition-all text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 ${inputError
                                    ? 'border-red-400 focus:border-red-400'
                                    : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'
                                } ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={adding || !inputDomain.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 text-sm shadow-lg"
                    >
                        {adding
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Plus className="w-4 h-4" />}
                        {adding ? t('adding') : t('add_btn')}
                    </button>
                </div>
                {inputError && (
                    <p className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />{inputError}
                    </p>
                )}
                <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-2">{t('add_hint')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Domain list ── */}
                <div className="lg:col-span-2 space-y-3">

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-800/30 text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                        </div>
                    )}

                    {/* Loading skeletons */}
                    {loading && (
                        <div className="space-y-3">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && domains.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
                            <Globe className="w-12 h-12 text-gray-200 dark:text-zinc-700 mb-3" />
                            <h3 className="text-sm font-black text-gray-700 dark:text-zinc-300 mb-1">{t('empty_title')}</h3>
                            <p className="text-xs text-gray-400 dark:text-zinc-600">{t('empty_desc')}</p>
                        </div>
                    )}

                    {/* Domain rows */}
                    {!loading && domains.map(d => (
                        <DomainRow
                            key={d.id}
                            domain={d}
                            onDelete={handleDelete}
                            onCheckStatus={handleCheckStatus}
                        />
                    ))}
                </div>

                {/* ── Nameservers guide ── */}
                <div className="space-y-4">
                    <NameserverCard />

                    {/* Step 2 card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm p-5">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('verify_title')}</h3>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 leading-relaxed">{t('verify_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}