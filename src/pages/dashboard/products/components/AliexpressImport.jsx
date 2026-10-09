import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Download, Link2, Loader2, CheckCircle2, Unplug } from 'lucide-react';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';

// «جلب من AliExpress»: يلصق التاجر رابط منتجه فتُملأ خانات المنتج (الاسم، الوصف، الصور، الخصائص).
// يتطلب ربط حساب AliExpress مرة واحدة (OAuth) — الرمز يُحفظ في الخادم فقط.
export default function AliexpressImport({ onImported, notify }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'products.aliexpress' });
  const [status, setStatus] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${getAccessToken()}` };

  const loadStatus = () =>
    axios.get(`${baseURL}/aliexpress/status`, { headers }).then((r) => setStatus(r.data)).catch(() => setStatus({ configured: false }));

  useEffect(() => {
    loadStatus();
    // العودة من صفحة موافقة AliExpress
    const q = new URLSearchParams(window.location.search);
    const result = q.get('aliexpress');
    if (result) {
      if (result === 'connected') notify('success', t('connected_ok'));
      else notify('error', q.get('message') || t('connect_error'));
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/aliexpress/connect`, { headers });
      window.location.href = data.url;
    } catch (e) {
      notify('error', e.response?.data?.message || t('connect_error'));
    }
  };

  const disconnect = async () => {
    await axios.delete(`${baseURL}/aliexpress/connect`, { headers }).catch(() => {});
    loadStatus();
  };

  const runImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${baseURL}/aliexpress/import`, { url: url.trim(), language: i18n.language }, { headers });
      onImported(data);
      notify('success', data.price ? t('imported_price', { price: data.price, currency: data.currency }) : t('imported'));
      setUrl('');
    } catch (e) {
      const msg = e.response?.data?.message;
      notify('error', Array.isArray(msg) ? msg[0] : msg || t('import_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!status || status.configured === false) return null;

  return (
    <div className="rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50/60 dark:bg-orange-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#FF4747] text-white flex items-center justify-center text-xs font-black">AE</span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t('title')}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{t('subtitle')}</p>
          </div>
        </div>
        {status.connected && !status.shared && (
          <button type="button" onClick={disconnect} className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500">
            <Unplug size={13} />{t('disconnect')}
          </button>
        )}
      </div>

      {status.connected ? (
        <>
          <div className="flex gap-2">
            <input
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runImport(); } }}
              placeholder="https://www.aliexpress.com/item/1005000000000000.html"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm dark:text-white outline-none focus:border-orange-400"
            />
            <button type="button" onClick={runImport} disabled={loading || !url.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF4747] hover:bg-[#e63c3c] text-white text-sm font-bold disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}{t('import_btn')}
            </button>
          </div>
          {status.account && !status.shared && (
            <p className="flex items-center gap-1 text-[11px] text-emerald-600"><CheckCircle2 size={12} />{t('connected_as', { account: status.account })}</p>
          )}
        </>
      ) : (
        <button type="button" onClick={connect}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF4747] hover:bg-[#e63c3c] text-white text-sm font-bold">
          <Link2 size={15} />{t('connect_btn')}
        </button>
      )}
    </div>
  );
}
