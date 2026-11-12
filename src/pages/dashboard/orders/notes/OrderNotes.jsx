import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Loader2, MessageSquareText, Send, X } from 'lucide-react';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import { noteBody, REASONS } from './notes';

const auth = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const postNote = (orderId, body) => axios.post(`${baseURL}/orders/${orderId}/notes`, body, auth());

function ReasonChips({ value, onChange, t }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {REASONS.map((r) => (
        <button key={r} type="button" onClick={() => onChange(value === r ? null : r)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${value === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-400'}`}>
          {t(`notes.reasons.${r}`)}
        </button>
      ))}
    </div>
  );
}

/**
 * بعد تغيير الحالة (ملغى، مرتجع، مؤجل، لا يرد…): سبب اختياري — «تخطّي» لا يحفظ شيئاً
 * change = { orderId, from, to, name }
 */
export function ReasonModal({ change, onClose, onSaved }) {
  const { t } = useTranslation('translation', { keyPrefix: 'orders' });
  const [reason, setReason] = useState(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  if (!change) return null;
  const body = noteBody({ from: change.from, to: change.to, reason, text });
  const save = async () => {
    if (!body) return onClose();
    setSaving(true);
    try { await postNote(change.orderId, body); onSaved?.(); onClose(); } catch { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{t('notes.reason_title')}</p>
            <p className="text-xs text-gray-500">{change.name ? `${change.name} — ` : ''}{t(`status.${change.to}`, change.to)}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <ReasonChips value={reason} onChange={setReason} t={t} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={500} placeholder={t('notes.text_ph')}
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 outline-none focus:border-indigo-400 text-gray-900 dark:text-white" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-500">{t('notes.skip')}</button>
          <button type="button" onClick={save} disabled={saving || !body} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />}{t('notes.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** سجل الطلب: ملاحظات المتجر والمؤكّدين، وخانة لملاحظة جديدة. reloadKey يعيد التحميل (بعد حفظ سبب) */
export function OrderNotesPanel({ orderId, reloadKey = 0 }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    axios.get(`${baseURL}/orders/${orderId}/notes`, auth()).then((r) => setList(r.data || [])).catch(() => setList([]));
  }, [orderId]);
  useEffect(() => { load(); }, [load, reloadKey]);

  const add = async () => {
    const body = noteBody({ text });
    if (!body) return;
    setSaving(true);
    try { await postNote(orderId, body); setText(''); load(); } finally { setSaving(false); }
  };

  const when = (d) => new Date(d).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-2">
        <MessageSquareText size={16} className="text-indigo-500" />
        <h2 className="font-bold text-gray-900 dark:text-white">{t('notes.title')}</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={t('notes.add_ph')}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 outline-none focus:border-indigo-400 text-gray-900 dark:text-white" />
          <button type="button" onClick={add} disabled={saving || !text.trim()} className="shrink-0 px-4 rounded-xl bg-indigo-600 text-white disabled:opacity-40" aria-label={t('notes.save')}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        {!list ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
          : list.length === 0 ? <p className="text-center text-sm text-gray-400 py-2">{t('notes.empty')}</p>
          : (
            <ul className="space-y-3">
              {list.map((n) => (
                <li key={n.id} className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="font-bold text-gray-700 dark:text-zinc-200">{n.authorName || '—'}</span>
                    {n.source === 'confirmation' && <span className="px-1.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-600">{t('notes.confirmer')}</span>}
                    {n.toStatus && <span>{n.fromStatus ? `${t(`status.${n.fromStatus}`, n.fromStatus)} ← ` : ''}{t(`status.${n.toStatus}`, n.toStatus)}</span>}
                    <span className="ms-auto" dir="ltr">{when(n.createdAt)}</span>
                  </div>
                  {n.reason && <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold">{t(`notes.reasons.${n.reason}`)}</span>}
                  {n.text && <p className="text-sm text-gray-800 dark:text-zinc-100 whitespace-pre-wrap">{n.text}</p>}
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
