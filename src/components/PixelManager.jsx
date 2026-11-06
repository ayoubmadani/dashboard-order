import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Facebook,
  Music2,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';
import Loading from './Loading';

const PIXEL_TYPES = [
  {
    id: 'facebook',
    labelKey: 'types.facebook',
    icon: Facebook,
    color: '#1877F2',
    descriptionKey: 'descriptions.facebook'
  },
  {
    id: 'tiktok',
    labelKey: 'types.tiktok',
    icon: Music2,
    color: '#000000',
    descriptionKey: 'descriptions.tiktok'
  },
  {
    id: 'google',
    labelKey: 'types.google',
    icon: FcGoogle,
    color: '#4285F4',
    descriptionKey: 'descriptions.google'
  },
];

const DEFAULT_EVENTS = [
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
];

export const PixelManager = ({ storeId }) => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'Pixels' });
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  // تعديل في السطر نفسه (بلا نافذة): { id, type, name, pixelId, token, clearToken, hasAccessToken }
  const [inline, setInline] = useState(null);
  const [savingInline, setSavingInline] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('all');
  const [quick, setQuick] = useState({}); // { facebook: { name, pixelId, token } } — الإضافة السريعة في كل بطاقة
  const [tokenHelp, setTokenHelp] = useState(false);
  const q = (type) => quick[type] || {};
  const setQ = (type, k) => (e) => setQuick((x) => ({ ...x, [type]: { ...(x[type] || {}), [k]: e.target.value } }));
  const [adding, setAdding] = useState(null);

  const language = i18n.language
  
  


  const fetchPixels = useCallback(async () => {
    if (!storeId) { setPixels([]); setLoading(false); return; }
    try {
      const token = getAccessToken();
      const response = await axios.get(`${baseURL}/stores/${storeId}/pixels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPixels(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching pixels:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchPixels();
  }, [fetchPixels]);

  // إضافة سريعة من بطاقة المنصة: الاسم والمعرّف، ولفيسبوك رمز Conversions API (اختياري)
  const quickAdd = async (type) => {
    const { name = '', pixelId = '', token = '' } = q(type);
    if (!pixelId.trim() || !storeId) return;
    setAdding(type);
    try {
      const payload = { name: name.trim(), type, pixelId: pixelId.trim(), events: DEFAULT_EVENTS, isActive: true };
      if (type === 'facebook' && token.trim()) payload.accessToken = token.trim();
      await axios.post(`${baseURL}/stores/${storeId}/pixels`, payload, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      setQuick((x) => ({ ...x, [type]: {} }));
      fetchPixels();
    } catch (error) {
      alert(error.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setAdding(null);
    }
  };

  const setI = (k) => (e) => setInline((x) => ({ ...x, [k]: e.target.value }));
  const saveInline = async () => {
    if (!inline?.pixelId?.trim()) return;
    setSavingInline(true);
    try {
      const payload = { name: (inline.name || '').trim(), pixelId: inline.pixelId.trim() };
      if (inline.type === 'facebook') {
        if (inline.token?.trim()) payload.accessToken = inline.token.trim();
        else if (inline.clearToken) payload.accessToken = '';
        payload.testEventCode = ''; // وضع الاختبار أُزيل من الواجهة — لا يبقى رمز اختبار قديم يعطّل الأحداث
      }
      await axios.patch(`${baseURL}/stores/pixels/${inline.id}`, payload, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      setInline(null);
      fetchPixels();
    } catch (error) {
      alert(error.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSavingInline(false);
    }
  };

  const handleDelete = async (pixelId) => {
    if (!window.confirm(t('confirmDelete'))) return;

    try {
      const token = getAccessToken();
      await axios.delete(`${baseURL}/stores/pixels/${pixelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPixels();
    } catch (error) {
      console.error('Error deleting pixel:', error);
    }
  };

  const handleToggle = async (pixelId) => {
    setTogglingId(pixelId);
    try {
      const token = getAccessToken();
      await axios.patch(`${baseURL}/stores/pixels/${pixelId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPixels();
    } catch (error) {
      console.error('Error toggling pixel:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredPixels = pixels.filter(p => scopeFilter === 'all' || (p.scope || 'store') === scopeFilter);

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div  className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6" dir="auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{t('subtitle')}</p>
      </div>

      {storeId && pixels.some(p => (p.scope || 'store') !== 'store') && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl mb-4 w-fit">
          {['all', 'store', 'landing_page'].map(scope => (
            <button key={scope} type="button" onClick={() => setScopeFilter(scope)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scopeFilter === scope
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}>
              {t(`scopeFilter.${scope}`)}
            </button>
          ))}
        </div>
      )}

      {!storeId ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-zinc-400">{t('noStore')}</p>
        </div>
      ) : (
        // بطاقة لكل منصة: رأس بلونها، إضافة سريعة بالمعرّف، ثم معرّفاتها مع تفعيل/إعدادات/حذف
        <div className="space-y-4">
          {PIXEL_TYPES.map((type) => {
            const list = filteredPixels.filter(p => p.type === type.id);
            const Icon = type.icon;
            const dark = type.id === 'tiktok';
            return (
              <section key={type.id} className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: type.color }}>
                <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: type.id === 'google' ? '#F1F5FE' : type.color }}>
                  <div className={`flex items-center gap-2 font-bold ${type.id === 'google' ? 'text-gray-900' : 'text-white'}`}>
                    <Icon size={18} style={type.id === 'google' ? undefined : { color: '#fff' }} />
                    {t(type.labelKey)}
                  </div>
                  <span className={`text-xs font-semibold ${type.id === 'google' ? 'text-gray-500' : 'text-white/80'}`}>{t('card.count', { count: list.length })}</span>
                </div>

                <div className="p-4 space-y-3 bg-white dark:bg-zinc-900">
                  <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); quickAdd(type.id); }}
                    className={`grid gap-2 grid-cols-1 ${type.id === 'facebook' ? 'md:grid-cols-[1fr_1.2fr_1.4fr_auto]' : 'md:grid-cols-[1fr_1.4fr_auto]'}`}>
                    <input type="text" name={`px-name-${type.id}`} autoComplete="off" data-1p-ignore data-lpignore="true" value={q(type.id).name ?? ''} onChange={setQ(type.id, 'name')} placeholder={t('card.name')}
                      className="min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-400" />
                    <input type="text" inputMode="numeric" name={`px-id-${type.id}`} autoComplete="off" data-1p-ignore data-lpignore="true" dir="ltr" value={q(type.id).pixelId ?? ''} onChange={setQ(type.id, 'pixelId')}
                      placeholder={type.id === 'google' ? t('form.pixelIdPlaceholderGoogle') : t('card.placeholder')}
                      className="min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm outline-none focus:border-indigo-400" />
                    {type.id === 'facebook' && (
                      <div className="relative min-w-0">
                        {/* نص عادي بنقاط (لا password): متصفح Chrome لا يعتبر البطاقة نموذج دخول فلا يملأ البريد وكلمة السر */}
                        <input type="text" name={`px-token-${type.id}`} autoComplete="off" data-1p-ignore data-lpignore="true" spellCheck={false} dir="ltr"
                          value={q(type.id).token ?? ''} onChange={setQ(type.id, 'token')} placeholder={t('card.token')}
                          style={q(type.id).token ? { WebkitTextSecurity: 'disc' } : undefined}
                          className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm outline-none focus:border-indigo-400" />
                        <button type="button" onClick={() => setTokenHelp(true)} title={t('card.tokenHelpTitle')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600"><HelpCircle size={18} /></button>
                      </div>
                    )}
                    <button type="submit" disabled={adding === type.id || !String(q(type.id).pixelId ?? '').trim()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold whitespace-nowrap disabled:opacity-50"
                      style={{ background: dark ? '#111' : type.id === 'google' ? '#4285F4' : type.color }}>
                      {adding === type.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{t('card.add')}
                    </button>
                  </form>

                  {list.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1">{t('card.empty')}</p>
                  ) : list.map((pixel) => inline?.id === pixel.id ? (
                    <form key={pixel.id} autoComplete="off" onSubmit={(e) => { e.preventDefault(); saveInline(); }}
                      className={`grid gap-2 grid-cols-1 p-3 rounded-xl border-2 ${pixel.type === 'facebook' ? 'md:grid-cols-[1fr_1.2fr_1.4fr_auto]' : 'md:grid-cols-[1fr_1.4fr_auto]'}`}
                      style={{ borderColor: type.color }}>
                      <input type="text" autoComplete="off" data-1p-ignore data-lpignore="true" value={inline.name} onChange={setI('name')} placeholder={t('card.name')}
                        className="min-w-0 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-400" />
                      <input type="text" inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" dir="ltr" value={inline.pixelId} onChange={setI('pixelId')} placeholder={t('card.placeholder')}
                        className="min-w-0 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono text-sm outline-none focus:border-indigo-400" />
                      {pixel.type === 'facebook' && (
                        <div className="min-w-0 space-y-1">
                          <div className="relative">
                            <input type="text" autoComplete="off" data-1p-ignore data-lpignore="true" spellCheck={false} dir="ltr" value={inline.token} onChange={(e) => setInline((x) => ({ ...x, token: e.target.value, clearToken: false }))}
                              placeholder={inline.hasAccessToken && !inline.clearToken ? t('form.tokenSaved') : t('card.token')}
                              style={inline.token ? { WebkitTextSecurity: 'disc' } : undefined}
                              className="w-full pl-3 pr-9 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono text-sm outline-none focus:border-indigo-400" />
                            <button type="button" onClick={() => setTokenHelp(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-blue-600"><HelpCircle size={16} /></button>
                          </div>
                          {inline.hasAccessToken && !inline.token && (
                            <button type="button" onClick={() => setInline((x) => ({ ...x, clearToken: !x.clearToken }))}
                              className={`text-[11px] font-semibold ${inline.clearToken ? 'text-gray-500' : 'text-rose-500'}`}>
                              {inline.clearToken ? t('form.keepToken') : t('form.removeToken')}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 md:self-start">
                        <button type="submit" disabled={savingInline || !inline.pixelId.trim()} title={t('form.saveChanges')}
                          className="flex-1 md:flex-none inline-flex items-center justify-center px-3 py-2 rounded-lg text-white disabled:opacity-50"
                          style={{ background: dark ? '#111' : type.id === 'google' ? '#4285F4' : type.color }}>
                          {savingInline ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button type="button" onClick={() => setInline(null)} title={t('cancel')}
                          className="flex-1 md:flex-none inline-flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300"><X size={16} /></button>
                      </div>
                    </form>
                  ) : (
                    <div key={pixel.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${pixel.isActive
                      ? 'border-gray-200 dark:border-zinc-700'
                      : 'border-gray-100 dark:border-zinc-800 opacity-60'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-gray-900 dark:text-white truncate" dir="ltr">{pixel.pixelId}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {pixel.name && <span className="text-[11px] text-gray-500 truncate max-w-[12rem]">{pixel.name}</span>}
                          {(pixel.scope || 'store') !== 'store' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">{t(`form.scope.${pixel.scope}`)}</span>
                          )}
                          {pixel.type === 'facebook' && (pixel.hasAccessToken
                            ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-semibold">Conversions API ✓</span>
                            : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{t('card.capiMissing')}</span>)}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleToggle(pixel.id)} disabled={togglingId === pixel.id}
                        title={pixel.isActive ? t('actions.deactivate') : t('actions.activate')}
                        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${pixel.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pixel.isActive ? 'start-[1.125rem]' : 'start-0.5'}`} />
                      </button>
                      <button type="button" onClick={() => setInline({ id: pixel.id, type: pixel.type, name: pixel.name || '', pixelId: pixel.pixelId || '', token: '', clearToken: false, hasAccessToken: !!pixel.hasAccessToken })} title={t('actions.edit')}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg shrink-0"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => handleDelete(pixel.id)} title={t('actions.delete')}
                        className="p-2 text-white bg-rose-500 hover:bg-rose-600 rounded-full shrink-0"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* شرح Jeton d'accès (زر ؟ في بطاقة فيسبوك) */}
      {tokenHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4" onClick={(e) => { if (e.target === e.currentTarget) setTokenHelp(false); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg overflow-hidden" dir="auto">
            <div className="flex items-center justify-between px-5 py-3.5 text-white font-bold" style={{ background: '#1877F2' }}>
              <span className="flex items-center gap-2"><HelpCircle size={18} />{t('card.tokenHelpTitle')}</span>
              <button type="button" onClick={() => setTokenHelp(false)} className="p-1 rounded-lg hover:bg-white/15"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
              <p>{t('card.tokenHelp1')}</p>
              <p>{t('card.tokenHelp2')}</p>
              <p className="text-gray-500">{t('card.tokenHelp3')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
                  <p className="font-bold text-gray-900 dark:text-white mb-1">{t('card.withoutLabel')}</p>
                  <p>{t('card.without')}</p>
                </div>
                <div className="rounded-xl border-2 border-blue-500 p-3">
                  <p className="font-bold text-blue-700 dark:text-blue-400 mb-1">{t('card.withLabel')} ✓</p>
                  <p>{t('card.with')}</p>
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-3 space-y-1">
                <p className="font-bold text-gray-900 dark:text-white">{t('card.tokenHowTitle')}</p>
                <p>{t('card.tokenHow')}</p>
              </div>
              <p className="text-xs text-gray-500">{t('card.tokenMeta')}</p>
              <div className="flex justify-end pt-1">
                <button type="button" onClick={() => setTokenHelp(false)} className="px-5 py-2 rounded-xl text-white text-sm font-bold" style={{ background: '#1877F2' }}>{t('card.close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};