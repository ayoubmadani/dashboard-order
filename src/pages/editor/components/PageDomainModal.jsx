import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Globe, Link2, Loader2, ExternalLink, Copy, RefreshCcw, Info, Unlink } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const DNS_RECORD = { type: 'CNAME', host: '@', value: 'mdstore.top' };

// Domains are created on the standalone Domain page (/dashboard/domain) —
// this modal only assigns an already-existing store domain to this exact
// page (scope: 'landing_page'), or detaches it back to scope: 'store'. Same
// idea as PagePixelsModal.jsx's per-page scoping, but the domain itself
// isn't created here since it's a shared, globally-unique resource the
// merchant manages in one place.
export default function PageDomainModal({ open, onClose, storeId, pageId }) {
  const { t } = useTranslation('translation', { keyPrefix: 'editor.domain' });
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}` });

  const fetchDomains = useCallback(async () => {
    if (!storeId) { setDomains([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/domain/store/${storeId}`, { headers: authHeaders() });
      setDomains(res.data || []);
    } catch {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [storeId, t]);

  useEffect(() => {
    if (open) fetchDomains();
  }, [open, fetchDomains]);

  if (!open) return null;

  const assigned = domains.find((d) => d.scope === 'landing_page' && d.builderPageId === pageId);
  const available = domains.filter((d) => d.scope === 'store');

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      const res = await axios.patch(
        `${baseURL}/domain/${selected}/assign-page`,
        { builderPageId: pageId, storeId },
        { headers: authHeaders() },
      );
      setDomains((prev) => prev.map((d) => (d.id === res.data.id ? res.data : d)));
      setSelected('');
      toast.success(t('assignSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('errors.assignFailed'));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!assigned) return;
    setUnassigning(true);
    try {
      await axios.patch(`${baseURL}/domain/${assigned.id}/unassign-page`, { storeId }, { headers: authHeaders() });
      setDomains((prev) => prev.map((d) => (d.id === assigned.id ? { ...d, scope: 'store', builderPageId: null } : d)));
      toast.success(t('unassignSuccess'));
    } catch {
      toast.error(t('errors.unassignFailed'));
    } finally {
      setUnassigning(false);
    }
  };

  const handleSync = async () => {
    if (!assigned) return;
    setSyncing(true);
    try {
      const res = await axios.patch(`${baseURL}/domain/sync/${assigned.id}`, {}, { headers: authHeaders() });
      if (res.data?.isActive) setDomains((prev) => prev.map((d) => (d.id === assigned.id ? { ...d, isActive: true } : d)));
    } catch {
      toast.error(t('errors.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const copyLink = () => {
    if (!assigned) return;
    navigator.clipboard?.writeText(`https://${assigned.domain}`);
    toast.success(t('copied'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
              <Globe size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('title')}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{t('subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : assigned ? (
          <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate font-mono" dir="ltr">{assigned.domain}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={copyLink} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg" title={t('copy')}>
                  <Copy size={15} />
                </button>
                <a href={`https://${assigned.domain}`} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg" title={t('open')}>
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${assigned.isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-bold uppercase tracking-tight text-gray-400">
                {assigned.isActive ? t('statusActive') : t('statusPending')}
              </span>
            </div>

            {!assigned.isActive && (
              <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 space-y-1.5" dir="ltr">
                <p className="text-[11px] text-gray-400 flex items-center gap-1"><Info size={11} className="text-amber-400 shrink-0" />{t('dnsHint')}</p>
                <p className="text-xs font-mono text-gray-700 dark:text-zinc-300">{DNS_RECORD.type} &nbsp; {DNS_RECORD.host} &nbsp; → &nbsp; {DNS_RECORD.value}</p>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg"
                >
                  {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
                  {t('checkNow')}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleUnassign}
              disabled={unassigning}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              {unassigning ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
              {t('unassign')}
            </button>
          </div>
        ) : available.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400 mb-3">{t('noAvailableDomains')}</p>
            <Link
              to="/dashboard/domain"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              <Globe size={15} />
              {t('goToDomainPage')}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              dir="ltr"
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none"
            >
              <option value="">{t('selectPlaceholder')}</option>
              {available.map((d) => (
                <option key={d.id} value={d.id}>{d.domain}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssign}
              disabled={assigning || !selected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {assigning ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {t('assign')}
            </button>
            <Link to="/dashboard/domain" className="block text-center text-[11px] text-indigo-500 hover:underline">
              {t('addNewDomain')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
