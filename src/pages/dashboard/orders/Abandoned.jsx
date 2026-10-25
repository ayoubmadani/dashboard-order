// الطلبات المتروكة: زبائن كتبوا هاتفهم في نموذج الطلب ولم يُكملوا — اتصال، واتساب، تحويل إلى طلب، تجاهل
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Loader2, MapPin, MessageCircle, Package, Phone, PlusCircle, ShoppingBasket, X } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const headers = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const money = (v) => Number(v || 0).toLocaleString('en-US');
const wa = (phone) => { const d = String(phone || '').replace(/\D/g, ''); return d ? `https://wa.me/${d.startsWith('0') ? `213${d.slice(1)}` : d}` : null; };

export default function Abandoned() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders.abandoned' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    const { data } = await axios.get(`${baseURL}/stores/${storeId}/abandoned`, { ...headers(), params: { page: p } });
    setHasMore(data.hasMore);
    setPage(p);
    setItems((prev) => (p === 1 ? data.items : [...(prev || []), ...data.items]));
  }, [storeId]);
  useEffect(() => { load(1).catch(() => setItems([])); }, [load]);

  const dismiss = async (a) => {
    await axios.delete(`${baseURL}/stores/${storeId}/abandoned/${a.id}`, headers()).catch(() => {});
    setItems((l) => l.filter((x) => x.id !== a.id));
  };
  const ago = (d) => new Date(d).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><ShoppingBasket className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-xs text-gray-400">{t('subtitle')}</p>
        </div>
      </div>

      {!items ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        : items.length === 0 ? <p className="text-center text-sm text-gray-400 py-16">{t('empty')}</p>
        : (
          <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800/60">
            {items.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  {a.productImage ? <img src={a.productImage} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate"><bdi>{a.name || t('no_name')}</bdi>
                    {a.pastOrders > 0 && <span className="ms-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">{t('past', { count: a.pastOrders })}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{a.productName ? <><bdi>{a.productName}</bdi>{a.productPrice ? <> · <bdi dir="ltr">{money(a.productPrice)} DA</bdi></> : null}</> : '—'}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-2">{ago(a.updatedAt)}{a.wilaya && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{a.wilaya}</span>}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={`tel:${a.phone}`} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold" dir="ltr"><Phone className="w-3.5 h-3.5" />{a.phone}</a>
                  {wa(a.phone) && <a href={wa(a.phone)} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><MessageCircle className="w-4 h-4" /></a>}
                  <button type="button" onClick={() => navigate('/dashboard/orders/new', { state: { draft: { name: a.name, phone: a.phone } } })}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold"><PlusCircle className="w-3.5 h-3.5" />{t('convert')}</button>
                  <button type="button" onClick={() => dismiss(a)} title={t('dismiss')} className="p-2 rounded-xl text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      {hasMore && <button type="button" onClick={() => load(page + 1)} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-bold text-gray-600 dark:text-zinc-300">{t('more')}</button>}
    </div>
  );
}
