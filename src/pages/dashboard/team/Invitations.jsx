import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { Mail, Check, X, Loader2, Store } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const errMsg = (err, fallback) => {
  const m = err?.response?.data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

// دعوات المستخدم للانضمام لمتاجر غيره
export default function Invitations() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'team' });
  const isRtl = i18n.dir() === 'rtl';
  const { fetchStores, refreshInvitations } = useOutletContext();
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try { setItems((await axios.get(`${baseURL}/me/invitations`, auth())).data); }
    catch (err) { toast.error(errMsg(err, t('error'))); setItems([]); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const answer = async (inv, accept) => {
    setBusy(inv.id);
    try {
      await axios.post(`${baseURL}/invitations/${inv.id}/${accept ? 'accept' : 'reject'}`, {}, auth());
      if (accept) { toast.success(t('accepted')); await fetchStores?.(); }
      await load();
      refreshInvitations?.();
    } catch (err) { toast.error(errMsg(err, t('error'))); }
    finally { setBusy(null); }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto space-y-5">
      <Toaster position="top-center" richColors />
      <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
        <span className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><Mail size={22} /></span>
        {t('invitations_title')}
      </h1>

      {items === null ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-10 text-center text-sm text-gray-400">{t('invitations_empty')}</div>
      ) : (
        <div className="space-y-3">
          {items.map((inv) => (
            <div key={inv.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 flex flex-wrap items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0"><Store size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-gray-900 dark:text-white truncate">{inv.storeName}</p>
                <p className="text-xs text-gray-500">{inv.groupName ? t('invited_by', { owner: inv.ownerName, group: inv.groupName }) : t('invited_by_no_group', { owner: inv.ownerName })}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(inv.permissions || []).map((p) => <span key={p} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">{t(`perm.${p}`)}</span>)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => answer(inv, true)} disabled={busy === inv.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">
                  {busy === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('accept')}
                </button>
                <button onClick={() => answer(inv, false)} disabled={busy === inv.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 text-xs font-bold disabled:opacity-50">
                  <X size={14} /> {t('reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
