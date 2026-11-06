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
  const [showModal, setShowModal] = useState(false);
  const [editingPixel, setEditingPixel] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('all');
  const [quick, setQuick] = useState({}); // { facebook: { name, pixelId, token } } — الإضافة السريعة في كل بطاقة
  const [tokenHelp, setTokenHelp] = useState(false);
  const q = (type) => quick[type] || {};
  const setQ = (type, k) => (e) => setQuick((x) => ({ ...x, [type]: { ...(x[type] || {}), [k]: e.target.value } }));
  const [adding, setAdding] = useState(null);

  const language = i18n.language
  
  

  const [formData, setFormData] = useState({
    name: '',
    type: 'facebook',
    pixelId: '',
    accessToken: '',
    testEventCode: '',
    clearToken: false,
    events: DEFAULT_EVENTS,
    isActive: true,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingPixel && !storeId) {
      alert(t('noStore'));
      return;
    }

    try {
      const token = getAccessToken();
      const url = editingPixel 
        ? `${baseURL}/stores/pixels/${editingPixel.id}`
        : `${baseURL}/stores/${storeId}/pixels`;
      
      const method = editingPixel ? 'patch' : 'post';
      
      // التوكن لا يُعاد من الخادم أبداً: يُرسل فقط إن كُتب جديد، أو "" لمسحه
      const { accessToken, clearToken, testEventCode, ...rest } = formData;
      const payload = { ...rest };
      if (formData.type === 'facebook') {
        if (accessToken.trim()) payload.accessToken = accessToken.trim();
        else if (clearToken) payload.accessToken = '';
        payload.testEventCode = testEventCode.trim();
      }
      await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowModal(false);
      setEditingPixel(null);
      resetForm();
      fetchPixels();
    } catch (error) {
      console.error('Error saving pixel:', error);
      alert(error.response?.data?.message || t('errors.saveFailed'));
    }
  };

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

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'facebook',
      pixelId: '',
      accessToken: '',
      testEventCode: '',
      clearToken: false,
      events: DEFAULT_EVENTS,
      isActive: true,
    });
  };

  const openEdit = (pixel) => {
    setEditingPixel(pixel);
    setFormData({
      name: pixel.name || '',
      type: pixel.type,
      pixelId: pixel.pixelId,
      accessToken: '',
      testEventCode: pixel.testEventCode || '',
      clearToken: false,
      events: DEFAULT_EVENTS,
      isActive: pixel.isActive,
    });
    setShowModal(true);
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
                  ) : list.map((pixel) => (
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
                            ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-semibold">Conversions API ✓{pixel.testEventCode ? ` · ${t('form.testMode')}` : ''}</span>
                            : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{t('card.capiMissing')}</span>)}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleToggle(pixel.id)} disabled={togglingId === pixel.id}
                        title={pixel.isActive ? t('actions.deactivate') : t('actions.activate')}
                        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${pixel.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pixel.isActive ? 'start-[1.125rem]' : 'start-0.5'}`} />
                      </button>
                      <button type="button" onClick={() => openEdit(pixel)} title={t('card.advanced')}
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

      {/* نافذة الإعدادات: خاصة بمنصة البيكسل (رأس بلونها، بلا اختيار نوع) — عريضة على عمودين بلا تمرير */}
      {showModal && (() => {
        const pt = PIXEL_TYPES.find(p => p.id === formData.type) || PIXEL_TYPES[0];
        const Icon = pt.icon;
        const light = pt.id === 'google';
        const fb = pt.id === 'facebook';
        const field = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-400';
        const label = 'block text-xs font-bold text-gray-600 dark:text-zinc-400 mb-1.5';
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}>
            <div className={`bg-white dark:bg-zinc-900 rounded-2xl w-full ${fb ? 'max-w-3xl' : 'max-w-xl'} max-h-[95vh] overflow-y-auto overflow-hidden`} dir="auto">
              <div className="flex items-center gap-2 px-6 py-4 font-bold" style={{ background: light ? '#F1F5FE' : pt.color, color: light ? '#111827' : '#fff' }}>
                <Icon size={20} style={light ? undefined : { color: '#fff' }} />
                {t(pt.labelKey)} — {editingPixel ? t('modal.editTitle') : t('modal.addTitle')}
              </div>

              <div className={`p-6 grid gap-5 ${fb ? 'md:grid-cols-2' : ''}`}>
                <div className="space-y-4">
                  <div>
                    <label className={label}>{t('form.pixelIdLabel')} *</label>
                    <input type="text" dir="ltr" required value={formData.pixelId}
                      onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                      placeholder={light ? t('form.pixelIdPlaceholderGoogle') : t('form.pixelIdPlaceholder')}
                      className={`${field} font-mono`} />
                  </div>
                  <div>
                    <label className={label}>{t('form.nameLabel')}</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('form.namePlaceholder')} className={field} />
                  </div>
                </div>

                {fb && (
                  <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">Conversions API</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t('form.capiHint')}</p>
                    </div>
                    <div>
                      <label className={label}>{t('form.accessTokenLabel')}</label>
                      <input type="password" autoComplete="off" dir="ltr" value={formData.accessToken}
                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value, clearToken: false })}
                        placeholder={editingPixel?.hasAccessToken && !formData.clearToken ? t('form.tokenSaved') : t('form.accessTokenPlaceholder')}
                        className={`${field} bg-white font-mono`} />
                      {editingPixel?.hasAccessToken && !formData.accessToken && (
                        <button type="button" onClick={() => setFormData({ ...formData, clearToken: !formData.clearToken })}
                          className={`mt-1.5 text-xs font-semibold ${formData.clearToken ? 'text-gray-500' : 'text-rose-500'}`}>
                          {formData.clearToken ? t('form.keepToken') : t('form.removeToken')}
                        </button>
                      )}
                    </div>
                    <div>
                      <label className={label}>{t('form.testEventCodeLabel')}</label>
                      <input type="text" dir="ltr" value={formData.testEventCode}
                        onChange={(e) => setFormData({ ...formData, testEventCode: e.target.value })}
                        placeholder="TEST12345" className={`${field} bg-white font-mono`} />
                      <p className="text-[11px] text-gray-400 mt-1">{t('form.testEventCodeHint')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 pb-6">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-zinc-800 rounded-xl font-semibold text-sm">{t('cancel')}</button>
                <button type="button" onClick={handleSubmit}
                  className="px-5 py-2.5 text-white rounded-xl font-semibold text-sm"
                  style={{ background: pt.id === 'tiktok' ? '#111' : light ? '#4285F4' : pt.color }}>
                  {editingPixel ? t('form.saveChanges') : t('form.addPixel')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};