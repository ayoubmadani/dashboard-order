import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Globe, Plus, Copy, CheckCircle2, XCircle, Clock,
    Loader2, Trash2, RefreshCcw, ShieldCheck, ShieldAlert,
    AlertTriangle, ChevronRight, ExternalLink, Server, Zap, FileCode, Info
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { Link } from 'react-router-dom';

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

// ─────────────────────────────────────────────
//  DNS Record Row (New Component)
// ─────────────────────────────────────────────
function DnsRecordBox({ type, host, value, label }) {
    const [copied, setCopied] = useState(false);
    const copy = (txt) => {
        navigator.clipboard.writeText(txt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-2 mb-4 last:mb-0">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">{label}</span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-[9px] font-bold text-gray-500">{type}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {/* Host Field */}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 rounded-xl">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Host / Name</p>
                        <code className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-200 truncate block">{host}</code>
                    </div>
                    <button onClick={() => copy(host)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-gray-400">
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                </div>
                {/* Value Field */}
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700 rounded-xl">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Value / Target</p>
                        <code className="text-xs font-mono font-bold text-gray-700 dark:text-zinc-200 truncate block">{value}</code>
                    </div>
                    <button onClick={() => copy(value)} className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-gray-400">
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  CNAME Setup Card (Replaces NameserverCard)
// ─────────────────────────────────────────────
function CnameSetupCard({ domainId, domainName }) {
    const { t } = useTranslation('translation', { keyPrefix: 'domain' });
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const headers = useAuthHeaders();

    useEffect(() => {
        const fetchInstructions = async () => {
            try {
                const { data } = await axios.get(`${baseURL}/domain/setup-instructions/${domainId}`, headers);
                setData(data);
                console.log(data);

            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (domainId) fetchInstructions();
    }, [domainId]);

    if (loading) return <Skeleton className="h-64 w-full" />;

    const cname = data?.instructions?.find(i => i.type === 'CNAME');
    const txt = data?.instructions?.find(i => i.type === 'TXT');

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 dark:border-zinc-800 bg-indigo-50/30 dark:bg-indigo-900/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                        <Zap size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-zinc-200">{t('setup_title', 'إعداد الربط السريع')}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">{t('setup_desc', 'أضف هذه السجلات في لوحة تحكم الدومين')}</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* CNAME Record */}
                <DnsRecordBox
                    label="1. سجل الربط (Main Record)"
                    type="CNAME"
                    host={cname?.host || '@'}
                    value={cname?.value || 'ironium.mdstore.top'}
                />

                <div className="h-px bg-gray-100 dark:bg-zinc-800 my-4" />

                {/* TXT Record */}
                <DnsRecordBox
                    label="2. سجل الأمان (SSL Verification)"
                    type="TXT"
                    host={txt?.host || '_cf-custom-hostname'}
                    value={txt?.value || '...جاري التحميل'}
                />
            </div>

            <div className="px-5 pb-5 flex items-start gap-2 italic">
                <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-400 leading-relaxed">
                    بعد إضافة السجلات، قد يستغرق التفعيل من 5 إلى 30 دقيقة.
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
//  Domain Row
// ─────────────────────────────────────────────
function DomainRow({ domain, onDelete, onSync, isSelected, onSelect }) {
    const { t } = useTranslation('domain');
    const [syncing, setSyncing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        await onSync(domain.id);
        setSyncing(false);
    };

    const status = domain.isActive ? 'active' : 'pending';

    return (
        <div
            onClick={() => onSelect(domain)}
            className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all overflow-hidden ${isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-lg scale-[1.01]'
                    : 'border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm'
                }`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                        <Globe className={`w-5 h-5 ${status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                        {/* رابط الدومين مع أيقونة "فتح خارجي" تظهر عند التحويم */}
                        <a
                            href={`https://${domain.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-1.5 text-sm font-black text-blue-600 dark:text-indigo-400 font-mono transition-colors hover:text-blue-700 dark:hover:text-indigo-300"
                        >
                            <span className="truncate">{domain.domain}</span>
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>

                        {/* حالة الاتصال مع نقطة (Indicator) ملونة */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                                }`} />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">
                                {status === 'active' ? 'متصل ومؤمن' : 'بانتظار الإعداد'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSync(); }}
                        disabled={syncing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-xl text-xs font-bold border border-gray-100 dark:border-zinc-700 disabled:opacity-50"
                    >
                        {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                        تحقق
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(domain.id); }}
                        className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-500/20"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {isSelected && !domain.isActive && (
                <div className="bg-indigo-500 text-white text-[10px] font-black py-1.5 text-center flex items-center justify-center gap-1">
                    <ChevronRight size={12} className="rotate-90" />
                    انظر تعليمات الربط في اليسار
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
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [inputDomain, setInputDomain] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchDomains();
    }, [storeId]);

    const fetchDomains = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${baseURL}/domain/store/${storeId}`, headers);
            setDomains(data);
            if (data.length > 0) setSelectedDomain(data[0]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        setAdding(true);
        try {
            const { data } = await axios.post(`${baseURL}/domain`, { domain: inputDomain, storeId }, headers);
            setDomains([data, ...domains]);
            setSelectedDomain(data);
            setInputDomain('');
        } catch (err) { alert(err.response?.data?.message || 'خطأ في الإضافة'); }
        finally { setAdding(false); }
    };

    const handleSync = async (id) => {
        try {
            const { data } = await axios.patch(`${baseURL}/domain/sync/${id}`, {}, headers);
            if (data.isActive) {
                setDomains(domains.map(d => d.id === id ? { ...d, isActive: true } : d));
            }
            return data;
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الدومين؟')) return;
        try {
            await axios.delete(`${baseURL}/domain/${id}`, headers);
            setDomains(domains.filter(d => d.id !== id));
            if (selectedDomain?.id === id) setSelectedDomain(null);
        } catch (err) { console.error(err); }
    };

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <Globe size={22} />
                        </div>
                        إدارة الدومينات المخصصة
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">اربط نطاقك الخاص بمتجرك بسهولة عبر سجلات CNAME</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputDomain}
                        onChange={e => setInputDomain(e.target.value.toLowerCase())}
                        placeholder="example.com"
                        className="flex-1 py-3 px-4 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none font-mono text-sm"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={adding || !inputDomain}
                        className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                        {adding ? <Loader2 className="animate-spin" /> : 'إضافة دومين'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <Skeleton className="h-20 w-full" />
                    ) : domains.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                            <Globe className="mx-auto text-gray-200 mb-4" size={48} />
                            <p className="text-gray-400 font-bold italic">لا يوجد دومينات مضافة بعد</p>
                        </div>
                    ) : (
                        domains.map(d => (
                            <DomainRow
                                key={d.id}
                                domain={d}
                                onDelete={handleDelete}
                                onSync={handleSync}
                                isSelected={selectedDomain?.id === d.id}
                                onSelect={setSelectedDomain}
                            />
                        ))
                    )}
                </div>

                {/* Instructions Section */}
                <div className="space-y-4">
                    {selectedDomain ? (
                        <CnameSetupCard
                            domainId={selectedDomain.id}
                            domainName={selectedDomain.domain}
                        />
                    ) : (
                        <div className="p-10 border-2 border-dashed rounded-3xl text-center text-gray-400 text-xs font-bold">
                            اختر دوميناً من القائمة لعرض تعليمات الربط
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}