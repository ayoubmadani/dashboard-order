import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Copy, ExternalLink, FileSpreadsheet, Loader2 } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import { buildSheetScript, SHEET_STATUS_COLORS } from './googleSheetScript';

const STATUS_KEYS = Object.keys(SHEET_STATUS_COLORS);
const isLocalUrl = (url) => /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url);

export default function GoogleSheetsTab() {
  const { t } = useTranslation('translation', { keyPrefix: 'settings' });
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'orders' });
  const storeId = localStorage.getItem('storeId');

  const [apiUrl, setApiUrl] = useState(baseURL || '');
  const [apiKey, setApiKey] = useState(null); // المفتاح الكامل — موجود فقط في هذه الجلسة
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const script = useMemo(() => {
    if (!apiKey) return '';
    return buildSheetScript({
      apiUrl,
      storeId,
      apiKey,
      sheetName: t('sheets_sheet_name'),
      statuses: STATUS_KEYS.map((value) => ({ value, label: tOrders(`status.${value}`), color: SHEET_STATUS_COLORS[value] })),
      headers: [
        'ID',
        t('sheets_col_date'), t('sheets_col_name'), t('sheets_col_phone'), t('sheets_col_contact'),
        t('sheets_col_wilaya'), t('sheets_col_commune'), t('sheets_col_ship'), t('sheets_col_products'),
        t('sheets_col_items_total'), t('sheets_col_ship_price'), t('sheets_col_total'), t('sheets_col_source'),
        t('sheets_col_status'),
      ],
      texts: {
        syncNow: t('sheets_menu_sync'),
        reinstall: t('sheets_menu_setup'),
        added: t('sheets_toast_added'),
        saved: t('sheets_toast_saved'),
        failed: t('sheets_toast_failed'),
        home: t('sheets_ship_home'),
        office: t('sheets_ship_office'),
        digital: t('sheets_ship_digital'),
      },
    });
  }, [apiKey, apiUrl, storeId, t, tOrders]);

  const handleGenerate = async () => {
    setCreating(true);
    setError('');
    try {
      const { data } = await axios.post(
        `${baseURL}/api-keys`,
        { name: 'Google Sheets', expiresInDays: 365 },
        { headers: { Authorization: `Bearer ${getAccessToken()}` } },
      );
      setApiKey(data.key);
      setCopied(false);
    } catch (err) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join('\n') : message || err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
  };

  const steps = [t('sheets_step_1'), t('sheets_step_2'), t('sheets_step_3'), t('sheets_step_4'), t('sheets_step_5')];

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4 space-y-2">
        <h3 className="text-base font-black dark:text-white flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-emerald-600" />{t('sheets_title')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{t('sheets_hint')}</p>
      </div>

      {/* الألوان */}
      <div className="flex flex-wrap gap-2">
        {STATUS_KEYS.map((key) => (
          <span key={key} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700 border border-black/5"
            style={{ background: SHEET_STATUS_COLORS[key] }}>
            {tOrders(`status.${key}`)}
          </span>
        ))}
      </div>

      {!storeId ? (
        <p className="text-sm text-amber-600 font-bold">{t('sheets_no_store')}</p>
      ) : (
        <>
          <label className="block space-y-1.5">
            <span className="text-sm font-bold dark:text-zinc-300">{t('sheets_api_url')}</span>
            <input
              type="url"
              dir="ltr"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-indigo-400 dark:text-white text-sm font-mono"
            />
            {isLocalUrl(apiUrl) && (
              <span className="flex items-start gap-2 text-xs font-bold text-amber-600">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />{t('sheets_local_warning')}
              </span>
            )}
          </label>

          {!apiKey ? (
            <div className="space-y-2">
              <button
                onClick={handleGenerate}
                disabled={creating}
                className="px-6 py-3 text-sm font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {creating ? <Loader2 className="animate-spin h-4 w-4" /> : <FileSpreadsheet size={16} />}
                {t('sheets_generate')}
              </button>
              <p className="text-[11px] text-gray-400">{t('sheets_generate_hint')}</p>
              {error && <p className="text-xs font-bold text-red-500 whitespace-pre-line">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="flex items-start gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                <AlertTriangle size={15} className="shrink-0" />{t('sheets_key_warning')}
              </p>

              <ol className="space-y-2 text-sm text-gray-700 dark:text-zinc-300 list-decimal ps-5">
                {steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className="px-5 py-2.5 text-sm font-black rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center gap-2 active:scale-95 transition-all"
                >
                  {copied ? <><Check size={15} />{t('sheets_copied')}</> : <><Copy size={15} />{t('sheets_copy')}</>}
                </button>
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 text-sm font-bold rounded-xl border border-gray-200 dark:border-zinc-700 dark:text-zinc-200 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <ExternalLink size={14} />{t('sheets_open_new')}
                </a>
              </div>

              <pre dir="ltr" className="max-h-72 overflow-auto p-4 bg-zinc-950 text-zinc-100 rounded-2xl text-[11px] leading-relaxed">
                {script}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
