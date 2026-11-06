import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Facebook,
  Music2,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2
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
  const [quick, setQuick] = useState({}); // { facebook: '123…' } — خانة الإضافة السريعة في كل بطاقة
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

  // إضافة سريعة من بطاقة المنصة: المعرّف فقط (الاسم وConversions API من «الإعدادات» لاحقاً)
  const quickAdd = async (type) => {
    const pixelId = String(quick[type] ?? '').trim();
    if (!pixelId || !storeId) return;
    setAdding(type);
    try {
      await axios.post(`${baseURL}/stores/${storeId}/pixels`, { name: '', type, pixelId, events: DEFAULT_EVENTS, isActive: true },
        { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      setQuick((q) => ({ ...q, [type]: '' }));
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
                  <form onSubmit={(e) => { e.preventDefault(); quickAdd(type.id); }} className="flex gap-2">
                    <input type="text" dir="ltr" value={quick[type.id] ?? ''} onChange={(e) => setQuick((q) => ({ ...q, [type.id]: e.target.value }))}
                      placeholder={type.id === 'google' ? t('form.pixelIdPlaceholderGoogle') : t('card.placeholder')}
                      className="flex-1 min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm outline-none focus:border-indigo-400" />
                    <button type="submit" disabled={adding === type.id || !String(quick[type.id] ?? '').trim()}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl text-white text-sm font-bold disabled:opacity-50"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="auto">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPixel ? t('modal.editTitle') : t('modal.addTitle')}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  {t('form.typeLabel')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PIXEL_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        formData.type === type.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      <type.icon size={20} style={{ color: type.color }} />
                      <span className="text-sm font-medium">{t(type.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  {t('form.nameLabel')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('form.namePlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              {/* Pixel ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  {t('form.pixelIdLabel')} *
                </label>
                <input
                  type="text"
                  value={formData.pixelId}
                  onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                  placeholder={formData.type === 'google' ? t('form.pixelIdPlaceholderGoogle') : t('form.pixelIdPlaceholder')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
                  required
                />
              </div>

              {/* Meta Conversions API — فيسبوك فقط */}
              {formData.type === 'facebook' && (
                <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">Conversions API</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{t('form.capiHint')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">{t('form.accessTokenLabel')}</label>
                    <input
                      type="password"
                      autoComplete="off"
                      dir="ltr"
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value, clearToken: false })}
                      placeholder={editingPixel?.hasAccessToken && !formData.clearToken ? t('form.tokenSaved') : t('form.accessTokenPlaceholder')}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm"
                    />
                    {editingPixel?.hasAccessToken && !formData.accessToken && (
                      <button type="button" onClick={() => setFormData({ ...formData, clearToken: !formData.clearToken })}
                        className={`mt-2 text-xs font-semibold ${formData.clearToken ? 'text-gray-500' : 'text-rose-500'}`}>
                        {formData.clearToken ? t('form.keepToken') : t('form.removeToken')}
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">{t('form.testEventCodeLabel')}</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.testEventCode}
                      onChange={(e) => setFormData({ ...formData, testEventCode: e.target.value })}
                      placeholder="TEST12345"
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">{t('form.testEventCodeHint')}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                >
                  {editingPixel ? t('form.saveChanges') : t('form.addPixel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};