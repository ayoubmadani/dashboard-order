import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';

// رابط خادم MCP (Claude / ChatGPT) — المفتاح في آخر الرابط
const MCP_URL = 'https://mcp.mdstore.top/mcp';

// اسم العميل كما يرسله (claude-ai 1.0…) → اسم مقروء
const clientLabel = (client) => {
  const c = (client || '').toLowerCase();
  if (c.includes('claude')) return 'Claude';
  if (c.includes('openai') || c.includes('chatgpt')) return 'ChatGPT';
  if (c.includes('gemini')) return 'Gemini';
  return client;
};

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
  const [copied, setCopied] = useState(null); // 'key' | 'mcp' | null
  const [showKey, setShowKey] = useState(false); // الرابط مخفي (كلمة سر) افتراضياً
  const [revokingId, setRevokingId] = useState(null);

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString(i18n.language) : null);

  const fetchKeys = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/api-keys`, { headers });
      // المفاتيح الملغاة لا تُعرض (تبقى ملغاة في قاعدة البيانات ولا تعمل)
      setKeys((data || []).filter((k) => k.status !== 'revoked'));
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
      setCopied(null);
      setShowKey(false);
      setName('');
      fetchKeys();
    } catch (err) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join('\n') : message || err.message);
    } finally { setCreating(false); }
  };

  const handleCopy = async (which, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
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
        <div className="space-y-1.5">
          <p className="text-sm font-bold dark:text-zinc-300">{t('apikeys_mcp_label')}</p>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                dir="ltr"
                readOnly
                type={showKey ? 'text' : 'password'}
                value={`${MCP_URL}/${newKey}`}
                onFocus={(e) => e.target.select()}
                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-[11px] leading-5 outline-none focus:border-indigo-400 dark:text-zinc-200"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Hide' : 'Show'}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              onClick={() => handleCopy('mcp', `${MCP_URL}/${newKey}`)}
              className="px-4 py-2.5 text-xs font-black rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-all"
            >
              {copied === 'mcp' ? <><Check size={13} />{t('apikeys_copied')}</> : <><Copy size={13} />{t('apikeys_copy')}</>}
            </button>
          </div>
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
                  {key.connectedClient && (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                      {t('apikeys_connected_with', { client: clientLabel(key.connectedClient) })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  {t('apikeys_last_used')}: {formatDate(key.lastUsedAt) || t('apikeys_never_used')}
                  {' · '}{t('apikeys_expires')}: {formatDate(key.expiresAt)}
                  {key.connectedAt && <>{' · '}{t('apikeys_connected_at')}: {formatDate(key.connectedAt)}</>}
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
