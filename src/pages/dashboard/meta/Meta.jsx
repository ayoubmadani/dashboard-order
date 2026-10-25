// إعلانات Meta في لوحة التاجر: ربط حساب فيسبوك بالمتجر، الحساب الإعلاني، «تحديث من Meta»، الحملات وربطها بالمنتجات
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Facebook, Loader2, RefreshCw, Unplug, Megaphone } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const headers = () => ({ headers: { Authorization: `Bearer ${getAccessToken()}` } });
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const msg = (e, fb) => { const m = e?.response?.data?.message; return (Array.isArray(m) ? m[0] : m) || fb; };

// فترات بتوقيت الجزائر (نفس الخادم)
const localDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const shift = (ymd, n) => { const t = new Date(`${ymd}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const range = (k) => { const to = localDate(); return { from: k === 'today' ? to : k === '7d' ? shift(to, -6) : k === '30d' ? shift(to, -29) : `${to.slice(0, 8)}01`, to }; };
const PERIODS = ['today', '7d', '30d', 'month'];

export default function Meta() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'meta' });
  const isRtl = i18n.dir() === 'rtl';
  const storeId = localStorage.getItem('storeId');
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [notice, setNotice] = useState(null); // { ok, text }
  const [accounts, setAccounts] = useState(null);
  const [rate, setRate] = useState('');
  const [period, setPeriod] = useState('7d');
  const [campaigns, setCampaigns] = useState(null);
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(null);

  const base = `${baseURL}/stores/${storeId}/meta`;
  const loadStatus = useCallback(() => axios.get(base, headers()).then((r) => { setStatus(r.data); setRate(r.data.usdRate ? String(r.data.usdRate) : ''); }).catch(() => setStatus({ connected: false })), [base]);
  useEffect(() => { loadStatus(); }, [loadStatus]);

  // الرجوع من فيسبوك
  useEffect(() => {
    const m = params.get('meta');
    if (!m) return;
    setNotice(m === 'connected' ? { ok: true, text: t('connected') } : { ok: false, text: `${t('connect_failed')}${params.get('reason') ? ` — ${params.get('reason')}` : ''}` });
    setParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    if (!status.adAccountId) axios.get(`${base}/ad-accounts`, headers()).then((r) => setAccounts(r.data)).catch((e) => { setAccounts([]); setNotice({ ok: false, text: msg(e, t('error')) }); });
    axios.get(`${baseURL}/stores/${storeId}/products`, headers()).then((r) => setProducts(r.data?.products || r.data?.data || [])).catch(() => {});
  }, [status?.connected, status?.adAccountId, base, storeId, t]);

  const loadCampaigns = useCallback(() => {
    if (!status?.adAccountId) return;
    setCampaigns(null);
    axios.get(`${base}/campaigns`, { ...headers(), params: range(period) }).then((r) => setCampaigns(r.data)).catch(() => setCampaigns([]));
  }, [base, period, status?.adAccountId]);
  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const run = async (key, fn) => {
    setBusy(key);
    try { await fn(); } catch (e) { setNotice({ ok: false, text: msg(e, t('error')) }); } finally { setBusy(null); }
  };
  const connect = () => run('connect', async () => {
    const { data } = await axios.get(`${base}/connect-url`, { ...headers(), params: { app: 'dashboard' } });
    window.location.href = data.url;
  });
  const pickAccount = (id) => run('account', async () => { const { data } = await axios.put(`${base}/ad-account`, { adAccountId: id }, headers()); setStatus(data); });
  const saveRate = () => rate && run('rate', async () => { const { data } = await axios.patch(`${base}/rate`, { usdRate: Number(rate) }, headers()); setStatus(data); loadCampaigns(); });
  const sync = () => run('sync', async () => {
    const { data } = await axios.post(`${base}/sync`, {}, headers());
    setNotice({ ok: true, text: t('synced', { campaigns: data.campaigns }) });
    await loadStatus();
    loadCampaigns();
  });
  const link = (c, productId) => run(c.campaignId, async () => {
    await axios.put(`${base}/campaigns/${c.campaignId}/product`, { productId: productId || null }, headers());
    setCampaigns((l) => l.map((x) => (x.campaignId === c.campaignId ? { ...x, productId } : x)));
  });
  const disconnect = () => window.confirm(t('confirm_disconnect')) && run('disconnect', async () => {
    await axios.delete(base, headers());
    setStatus({ connected: false });
    setCampaigns(null);
  });

  const card = 'rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900';
  const usd = status?.currency && status.currency !== 'DZD';
  const totalSpend = (campaigns || []).reduce((s, c) => s + Number(c.spend || 0), 0);
  const totalDzd = (campaigns || []).reduce((s, c) => s + Number(c.spendDzd || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center"><Megaphone className="w-5 h-5" /></div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-xs text-gray-400">{t('subtitle')}</p>
        </div>
      </div>

      {notice && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="opacity-60">✕</button>
        </div>
      )}

      {!status ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        : !status.connected ? (
          <div className={`${card} p-8 text-center space-y-4 max-w-lg`}>
            <span className="mx-auto w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center"><Facebook className="w-7 h-7" /></span>
            <p className="font-bold text-gray-900 dark:text-white">{t('connect_title')}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{t('connect_hint')}</p>
            <button type="button" onClick={connect} disabled={busy === 'connect'} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1877F2] text-white font-bold disabled:opacity-60">
              {busy === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}{t('connect')}
            </button>
          </div>
        ) : (
          <>
            {/* الحساب */}
            <div className={`${card} p-4 flex flex-wrap items-center gap-4`}>
              <span className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0"><Facebook className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate"><bdi>{status.fbUserName}</bdi></p>
                <p className="text-xs text-gray-400 truncate">{status.adAccountName ? <bdi>{status.adAccountName} · {status.currency}</bdi> : t('pick_account')}</p>
              </div>
              {status.adAccountId && usd && (
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  {t('usd_rate')}
                  <input type="number" dir="ltr" value={rate} onChange={(e) => setRate(e.target.value)} onBlur={saveRate} placeholder="260"
                    className="w-20 px-2 py-1.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-center text-gray-900 dark:text-white outline-none focus:border-indigo-400" />
                  DA
                </label>
              )}
              {status.adAccountId && (
                <button type="button" onClick={sync} disabled={busy === 'sync'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">
                  <RefreshCw className={`w-4 h-4 ${busy === 'sync' ? 'animate-spin' : ''}`} />{t('sync')}
                </button>
              )}
              <button type="button" onClick={disconnect} title={t('disconnect')} className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Unplug className="w-4 h-4" /></button>
              {status.lastSyncAt && <p className="w-full text-[11px] text-gray-400">{t('last_sync', { date: new Date(status.lastSyncAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language) })}</p>}
            </div>

            {!status.adAccountId && (
              <div className={`${card} divide-y divide-gray-50 dark:divide-zinc-800/60`}>
                {accounts === null ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                  : accounts.length === 0 ? <p className="text-sm text-gray-500 p-4">{t('no_accounts')}</p>
                  : accounts.map((a) => (
                    <button key={a.id} type="button" onClick={() => pickAccount(a.id)} disabled={busy === 'account'} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start hover:bg-gray-50 dark:hover:bg-zinc-800/40">
                      <span><span className="block text-sm font-semibold text-gray-900 dark:text-white"><bdi>{a.name}</bdi></span><span className="block text-xs text-gray-400" dir="ltr">{a.id} · {a.currency}</span></span>
                      {!a.active && <span className="text-xs text-amber-600">{t('inactive')}</span>}
                    </button>
                  ))}
              </div>
            )}

            {status.adAccountId && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {PERIODS.map((p) => (
                    <button key={p} type="button" onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${period === p ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300'}`}>
                      {t(`period.${p}`)}
                    </button>
                  ))}
                  {campaigns?.length > 0 && <span className="ms-auto text-sm text-gray-500">{t('total')}: <b className="text-gray-900 dark:text-white" dir="ltr">{usd ? `$${fmt(totalSpend)}` : `${fmt(totalSpend)} DA`}</b>{usd && status.usdRate ? <span className="text-gray-400" dir="ltr"> · {fmt(totalDzd)} DA</span> : null}</span>}
                </div>
                {usd && !status.usdRate && <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3">{t('need_rate')}</p>}

                <div className={`${card} overflow-x-auto`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-zinc-800">
                        <th className="text-start font-bold px-4 py-3">{t('col.campaign')}</th>
                        <th className="text-start font-bold px-4 py-3">{t('col.spend')}</th>
                        <th className="text-start font-bold px-4 py-3">{t('col.impressions')}</th>
                        <th className="text-start font-bold px-4 py-3">{t('col.clicks')}</th>
                        <th className="text-start font-bold px-4 py-3">CTR</th>
                        <th className="text-start font-bold px-4 py-3">{t('col.product')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns === null && <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400 inline" /></td></tr>}
                      {campaigns?.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">{status.lastSyncAt ? t('no_campaigns') : t('sync_first')}</td></tr>}
                      {campaigns?.map((c) => (
                        <tr key={c.campaignId} className="border-b border-gray-50 dark:border-zinc-800/60">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span className="font-semibold text-gray-900 dark:text-white max-w-[260px] truncate"><bdi>{c.name}</bdi></span>
                            </span>
                          </td>
                          <td className="px-4 py-3" dir="ltr">
                            <b className="text-gray-900 dark:text-white">{usd ? `$${fmt(c.spend)}` : `${fmt(c.spend)} DA`}</b>
                            {usd && c.spendDzd != null && <span className="block text-[11px] text-gray-400">{fmt(c.spendDzd)} DA</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-zinc-300" dir="ltr">{fmt(c.impressions)}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-zinc-300" dir="ltr">{fmt(c.clicks)}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-zinc-300" dir="ltr">{c.impressions ? `${((c.clicks / c.impressions) * 100).toFixed(2)}%` : '—'}</td>
                          <td className="px-4 py-3">
                            <select value={c.productId || ''} onChange={(e) => link(c, e.target.value)} disabled={busy === c.campaignId}
                              className={`w-48 px-2 py-1.5 rounded-lg border text-xs outline-none ${c.productId ? 'border-indigo-200 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-gray-600 dark:text-zinc-300'}`}>
                              <option value="">{t('link_product')}</option>
                              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400">{t('profit_note')}</p>
              </>
            )}
          </>
        )}
    </div>
  );
}
