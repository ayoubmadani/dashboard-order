import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Loader2, X } from 'lucide-react';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import { rate, sourceMeta } from './sources';

const labelOf = (t, k) => {
  const m = sourceMeta(k);
  return ['direct', 'other', 'unknown'].includes(m.key) ? t(`sources.${m.key}`) : m.label;
};

/** شارة المصدر على سطر الطلب — التلميح يعرض الحملة/الإعلان إن وُجدا */
export function SourceBadge({ source }) {
  const { t } = useTranslation('translation', { keyPrefix: 'orders' });
  if (!source?.channel) return null;
  const m = sourceMeta(source.channel);
  const tip = [labelOf(t, source.channel), source.campaign, source.content, source.ref].filter(Boolean).join(' · ');
  return (
    <span title={tip} className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black text-white" style={{ backgroundColor: m.color }}>
      {m.short}
    </span>
  );
}

/** نافذة: الطلبات حسب المصدر (عدد، مؤكد، مسلّم، مرجع) لآخر 7/30/90 يوماً */
export function SourcesModal({ storeId, onClose, onPick }) {
  const { t } = useTranslation('translation', { keyPrefix: 'orders' });
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    axios.get(`${baseURL}/orders/sources/${storeId}`, { params: { days }, headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then((r) => setData(r.data?.rows ?? [])).catch(() => setData([]));
  }, [storeId, days]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{t('sources.title')}</p>
            <p className="text-xs text-gray-500">{t('sources.hint')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl w-fit">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg ${days === d ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              {t('sources.days', { n: d })}
            </button>
          ))}
        </div>
        {!data ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
          : !data.length ? <p className="text-center text-sm text-gray-400 py-8">{t('sources.empty')}</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-gray-500 text-start">
                    {['source', 'orders', 'confirmed', 'delivered', 'returned', 'cancelled'].map((h) => <th key={h} className="py-2 px-2 text-start font-semibold">{t(`sources.h_${h}`)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {data.map((r) => {
                    const m = sourceMeta(r.channel);
                    return (
                      <tr key={r.channel} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50" onClick={() => onPick?.(r.channel)}>
                        <td className="py-2.5 px-2">
                          <span className="inline-flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                            <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: m.color }}>{m.short}</span>
                            {labelOf(t, r.channel)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-bold tabular-nums">{r.total}</td>
                        <td className="py-2.5 px-2 tabular-nums">{r.confirmed} <span className="text-[11px] text-gray-400">({rate(r.confirmed, r.total)}%)</span></td>
                        <td className="py-2.5 px-2 tabular-nums text-emerald-600">{r.delivered}</td>
                        <td className="py-2.5 px-2 tabular-nums text-rose-600">{r.returned} <span className="text-[11px] text-gray-400">({rate(r.returned, r.delivered + r.returned)}%)</span></td>
                        <td className="py-2.5 px-2 tabular-nums text-gray-500">{r.cancelled}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[11px] text-gray-400 mt-3">{t('sources.utm_tip', { code: 'utm_campaign={{campaign.name}}&utm_content={{ad.name}}' })}</p>
            </div>
          )}
      </div>
    </div>
  );
}

/** قائمة اختيار المصدر للفلتر */
export function SourceSelect({ value, onChange }) {
  const { t } = useTranslation('translation', { keyPrefix: 'orders' });
  const keys = ['facebook', 'instagram', 'tiktok', 'google', 'youtube', 'snapchat', 'whatsapp', 'direct', 'other', 'unknown'];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 outline-none dark:[color-scheme:dark]">
      <option value="">{t('sources.all')}</option>
      {keys.map((k) => <option key={k} value={k}>{labelOf(t, k)}</option>)}
    </select>
  );
}
