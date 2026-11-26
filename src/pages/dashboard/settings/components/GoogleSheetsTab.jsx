import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, FileSpreadsheet, Loader2, RefreshCw, Unlink } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import useConfirmationEnabled from '../../../../hooks/useConfirmationEnabled';

// Google Sheets: ربط حساب Google مرة واحدة ← تفعيل المتاجر واحداً واحداً (لكل متجر ملف)
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px] rtl:-translate-x-[22px]' : 'translate-x-0.5 rtl:-translate-x-0.5'}`}
      />
    </button>
  );
}

export default function GoogleSheetsTab() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const confirmationOn = useConfirmationEnabled(); // شركات التأكيد تجريبية
  const headers = { Authorization: `Bearer ${getAccessToken()}` };
  const [params, setParams] = useSearchParams();

  const [data, setData] = useState(null); // { account, stores }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // 'connect' | 'disconnect' | storeId
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }

  const errorText = (err) => {
    const m = err?.response?.data?.message;
    return Array.isArray(m) ? m.join('\n') : m || err?.message;
  };

  const load = async () => {
    try {
      const res = await axios.get(`${baseURL}/google-sheets`, { headers });
      setData(res.data);
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err) });
    } finally {
      setLoading(false);
    }
  };

  // عائد من Google: ?gs=connected | ?gs=error&reason=…
  useEffect(() => {
    const gs = params.get('gs');
    if (gs === 'connected') setNotice({ type: 'ok', text: t('sheets_ok_connected') });
    else if (gs === 'error') {
      const reason = params.get('reason');
      const key = ['denied', 'scope', 'state'].includes(reason) ? `sheets_err_${reason}` : 'sheets_err_google';
      setNotice({ type: 'error', text: t(key) });
    }
    if (gs) setParams({}, { replace: true });
    load();
  }, []);

  // متجر فُعّل للتو: أول مزامنة في الخلفية — نحدّث الحالة بعد قليل
  useEffect(() => {
    if (!data?.stores?.some((s) => s.enabled && !s.lastSyncAt && s.status === 'active')) return undefined;
    const id = setTimeout(load, 5000);
    return () => clearTimeout(id);
  }, [data]);

  const run = async (key, fn) => {
    setBusy(key);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ type: 'error', text: errorText(err) });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const connect = () => run('connect', async () => {
    const res = await axios.get(`${baseURL}/google-sheets/connect-url`, { headers });
    window.location.href = res.data.url;
  });

  const disconnect = () => {
    if (!window.confirm(t('sheets_disconnect_confirm'))) return;
    run('disconnect', async () => {
      await axios.delete(`${baseURL}/google-sheets/account`, { headers });
      await load();
    });
  };

  const toggleStore = (store) => run(store.id, async () => {
    const action = store.enabled ? 'disable' : 'enable';
    const res = await axios.post(
      `${baseURL}/google-sheets/stores/${store.id}/${action}`,
      { lang: (i18n.language || 'ar').slice(0, 2) },
      { headers },
    );
    setData(res.data);
    if (action === 'enable') setNotice({ type: 'ok', text: t('sheets_ok_enabled', { name: store.name }) });
  });

  const syncStore = (store) => run(store.id, async () => {
    const res = await axios.post(`${baseURL}/google-sheets/stores/${store.id}/sync`, {}, { headers });
    const { result, ...rest } = res.data;
    setData(rest);
    if (result?.skipped) return;
    setNotice({
      type: 'ok',
      text: t('sheets_synced', { added: result?.added ?? 0, changed: (result?.fromSheet ?? 0) + (result?.toSheet ?? 0) }),
    });
  });

  const account = data?.account;
  const revoked = account && account.status !== 'active';
  const formatDate = (v) => (v ? new Date(v).toLocaleString(i18n.language) : t('sheets_never'));

  const connectButton = (label) => (
    <button
      onClick={connect}
      disabled={!!busy}
      className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-black text-gray-800 dark:text-zinc-100 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-60"
    >
      {busy === 'connect' ? <Loader2 size={18} className="animate-spin" /> : <GoogleMark />}
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4 space-y-2">
        <h3 className="text-base font-black dark:text-white flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-emerald-600" />
          {t('sheets_title')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{t('sheets_hint')}</p>
      </div>

      {notice && (
        <div
          role="status"
          className={`flex items-start gap-2 p-3.5 rounded-xl text-xs font-bold leading-relaxed ${notice.type === 'ok'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}
        >
          {notice.type === 'ok' ? <CheckCircle2 size={15} className="shrink-0 mt-px" /> : <AlertTriangle size={15} className="shrink-0 mt-px" />}
          <span className="whitespace-pre-line">{notice.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : !account ? (
        <div className="space-y-5">
          <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-300">
            {[t('sheets_how_1'), t('sheets_how_2'), t('sheets_how_3'), t(confirmationOn ? 'sheets_how_4' : 'sheets_how_4_self')].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                {line}
              </li>
            ))}
          </ul>
          {connectButton(t('sheets_connect'))}
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">{t('sheets_privacy')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* الحساب */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <GoogleMark />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('sheets_connected_as')}</p>
                <p className="text-sm font-black dark:text-white truncate" dir="ltr">{account.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {revoked && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                  {t('sheets_status_revoked')}
                </span>
              )}
              {revoked && connectButton(t('sheets_reconnect'))}
              <button
                onClick={disconnect}
                disabled={!!busy}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-60"
              >
                {busy === 'disconnect' ? <Loader2 size={14} className="animate-spin" /> : <Unlink size={14} />}
                {t('sheets_disconnect')}
              </button>
            </div>
          </div>

          {/* المتاجر */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-black dark:text-white">{t('sheets_stores_title')}</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t('sheets_stores_hint')}</p>
            </div>
            {!data.stores.length && <p className="text-sm text-gray-500 dark:text-zinc-400">{t('sheets_no_store')}</p>}
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-100 dark:border-zinc-800 rounded-2xl">
              {data.stores.map((store) => {
                const missing = store.enabled && store.status === 'file_missing';
                const working = busy === store.id;
                return (
                  <li key={store.id} className="p-4 flex flex-wrap items-center gap-3">
                    <Toggle
                      checked={store.enabled}
                      disabled={!!busy || revoked}
                      onChange={() => toggleStore(store)}
                      label={store.name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold dark:text-white truncate">{store.name}</p>
                      {store.enabled && (
                        <p className={`text-[11px] ${missing ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-zinc-400'}`}>
                          {missing ? t('sheets_status_file_missing') : `${t('sheets_last_sync')}: ${formatDate(store.lastSyncAt)}`}
                        </p>
                      )}
                      {store.enabled && !missing && store.lastError && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 break-words" dir="ltr">{store.lastError}</p>
                      )}
                    </div>
                    {working && <Loader2 size={16} className="animate-spin text-gray-400" />}
                    {store.enabled && !missing && store.spreadsheetUrl && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={store.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black active:scale-95 transition-all"
                        >
                          <ExternalLink size={13} />{t('sheets_open')}
                        </a>
                        <button
                          onClick={() => syncStore(store)}
                          disabled={!!busy || revoked}
                          aria-label={t('sheets_sync_now')}
                          title={t('sheets_sync_now')}
                          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <RefreshCw size={15} className={working ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
