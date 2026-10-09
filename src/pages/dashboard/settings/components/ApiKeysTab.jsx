import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Copy, KeyRound, Loader2 } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';

const STATUS_STYLES = {
  active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
  expired: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  revoked: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
};

export default function ApiKeysTab() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const token = getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  // المفتاح الكامل — يُعرض مرة واحدة بعد الإنشاء، ولا يُحفظ في أي مكان
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString(i18n.language) : null);

  const fetchKeys = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/api-keys`, { headers });
      setKeys(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const { data } = await axios.post(
        `${baseURL}/api-keys`,
        { name, expiresInDays: Number(expiresInDays) },
        { headers },
      );
      setNewKey(data.key);
      setCopied(false);
      setName('');
      fetchKeys();
    } catch (err) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join('\n') : message || err.message);
    } finally { setCreating(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
  };

  const handleRevoke = async (id) => {
    if (!confirm(t('apikeys_revoke_confirm'))) return;
    setRevokingId(id);
    try {
      await axios.delete(`${baseURL}/api-keys/${id}`, { headers });
      fetchKeys();
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setRevokingId(null); }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
      <div className="border-b border-gray-100 dark:border-zinc-800 pb-4 space-y-2">
        <h3 className="text-base font-black dark:text-white">{t('apikeys_title')}</h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{t('apikeys_hint')}</p>
      </div>

      {newKey && (
        <div className="space-y-3 p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/50">
          <p className="font-black text-sm text-amber-800 dark:text-amber-300">{t('apikeys_new_title')}</p>
          <p className="flex items-start gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle size={15} className="shrink-0" />{t('apikeys_new_warning')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <code dir="ltr" className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-700 rounded-2xl font-mono text-xs break-all dark:text-white">
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="px-6 py-3 text-sm font-black rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {copied ? <><Check size={15} />{t('apikeys_copied')}</> : <><Copy size={15} />{t('apikeys_copy')}</>}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs font-bold text-amber-700 dark:text-amber-400 underline">
            {t('apikeys_done')}
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-3 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 space-y-1.5">
            <span className="text-sm font-bold dark:text-zinc-300">{t('apikeys_name_label')}</span>
            <input
              type="text"
              required
              maxLength={100}
              placeholder={t('apikeys_name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-indigo-400 dark:text-white text-sm transition-all"
            />
          </label>
          <label className="sm:w-40 space-y-1.5">
            <span className="text-sm font-bold dark:text-zinc-300">{t('apikeys_expires_label')}</span>
            <input
              type="number"
              required
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-indigo-400 dark:text-white text-sm transition-all"
            />
          </label>
        </div>
        {error && <p className="text-xs font-bold text-red-500 whitespace-pre-line">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className={`px-8 py-3 text-sm font-black rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 w-[170px] ${creating ? 'bg-blue-400 dark:bg-blue-800/40 text-white/80 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`}
        >
          {creating ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : t('apikeys_create')}
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin h-5 w-5 text-blue-500" /></div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('apikeys_empty')}</p>
        ) : keys.map((key) => (
          <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <KeyRound size={18} className="shrink-0 text-zinc-400" />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm dark:text-white truncate">{key.name}</p>
                  <code dir="ltr" className="text-xs font-mono text-zinc-500">{key.prefix}…</code>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${STATUS_STYLES[key.status]}`}>
                    {t(`apikeys_status_${key.status}`)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  {t('apikeys_last_used')}: {formatDate(key.lastUsedAt) || t('apikeys_never_used')}
                  {' · '}{t('apikeys_expires')}: {formatDate(key.expiresAt)}
                </p>
              </div>
            </div>
            {key.status !== 'revoked' && (
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={revokingId === key.id}
                className="px-4 py-2 text-xs font-bold rounded-xl text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all self-start sm:self-auto"
              >
                {revokingId === key.id ? <Loader2 className="animate-spin h-4 w-4" /> : t('apikeys_revoke')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
