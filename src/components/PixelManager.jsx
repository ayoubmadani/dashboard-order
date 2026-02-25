import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Facebook, 
  Music2,
  Plus, 
  Trash2, 
  Edit2, 
  Power,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';

const PIXEL_TYPES = [
  { 
    id: 'facebook', 
    label: 'Facebook Pixel', 
    icon: Facebook, 
    color: '#1877F2',
    description: 'تتبع الإعلانات والتحويلات على Facebook'
  },
  { 
    id: 'tiktok', 
    label: 'TikTok Pixel', 
    icon: Music2, 
    color: '#000000',
    description: 'تتبع الأداء على TikTok Ads'
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
  const { t } = useTranslation();
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPixel, setEditingPixel] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [formData, setFormData] = useState({
    type: 'facebook',
    pixelId: '',
    accessToken: '',
    events: ['PageView', 'Purchase'],
    isActive: true,
  });

  const fetchPixels = useCallback(async () => {
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
    e.stopPropagation(); // منع انتشار الحدث للنموذج الأم
    
    try {
      const token = getAccessToken();
      const url = editingPixel 
        ? `${baseURL}/stores/pixels/${editingPixel.id}`
        : `${baseURL}/stores/${storeId}/pixels`;
      
      const method = editingPixel ? 'patch' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowModal(false);
      setEditingPixel(null);
      resetForm();
      fetchPixels();
    } catch (error) {
      console.error('Error saving pixel:', error);
      alert(error.response?.data?.message || 'فشل حفظ الـ Pixel');
    }
  };

  const handleDelete = async (pixelId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الـ Pixel؟')) return;

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
      type: 'facebook',
      pixelId: '',
      accessToken: '',
      events: ['PageView', 'Purchase'],
      isActive: true,
    });
  };

  const openEdit = (pixel) => {
    setEditingPixel(pixel);
    setFormData({
      type: pixel.type,
      pixelId: pixel.pixelId,
      accessToken: pixel.accessToken || '',
      events: pixel.events || ['PageView'],
      isActive: pixel.isActive,
    });
    setShowModal(true);
  };

  const getPixelIcon = (type) => {
    const pixelType = PIXEL_TYPES.find(p => p.id === type);
    const Icon = pixelType?.icon || Facebook;
    return <Icon size={20} style={{ color: pixelType?.color }} />;
  };

  const toggleEvent = (event) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Facebook size={20} className="text-indigo-600" />
            Pixels & Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Facebook Pixel, TikTok Pixel وغيرها
          </p>
        </div>
        {/* ✅ تم الإصلاح: type="button" صريح */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); // منع أي سلوك افتراضي
            resetForm();
            setEditingPixel(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          إضافة Pixel
        </button>
      </div>

      {pixels.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-zinc-400">
            لا توجد Pixels مضافة. أضف Pixel لتتبع أداء إعلاناتك.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pixels.map((pixel) => (
            <div
              key={pixel.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                pixel.isActive
                  ? 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                  : 'bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                  {getPixelIcon(pixel.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {PIXEL_TYPES.find(p => p.id === pixel.type)?.label || pixel.type}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">
                    ID: {pixel.pixelId}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pixel.isActive 
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20'
                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-700'
                    }`}>
                      {pixel.isActive ? 'نشط' : 'معطل'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {pixel.events?.length || 0} events
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* ✅ تم الإصلاح: type="button" */}
                <button
                  type="button"
                  onClick={() => handleToggle(pixel.id)}
                  disabled={togglingId === pixel.id}
                  className={`p-2 rounded-lg transition-colors ${
                    pixel.isActive
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {togglingId === pixel.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Power size={18} />
                  )}
                </button>
                {/* ✅ تم الإصلاح: onClick (بدون مسافة) و type="button" */}
                <button
                  type="button"
                  onClick={() => openEdit(pixel)}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                {/* ✅ تم الإصلاح: type="button" */}
                <button
                  type="button"
                  onClick={() => handleDelete(pixel.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPixel ? 'تعديل Pixel' : 'إضافة Pixel جديد'}
              </h3>
            </div>

            {/* ✅ استخدام div بدلاً من form لتفادي تداخل النماذج */}
            <div className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  نوع الـ Pixel
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pixel ID */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  Pixel ID *
                </label>
                <input
                  type="text"
                  value={formData.pixelId}
                  onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                  placeholder="مثال: 1234567890"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
                  required
                />
              </div>

              {/* Access Token (Facebook only) */}
              {formData.type === 'facebook' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                    Access Token (اختياري)
                  </label>
                  <input
                    type="password"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    placeholder="لـ Conversion API"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              )}

              {/* Events */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  الأحداث المُتتبعة
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_EVENTS.map((event) => (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleEvent(event)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.events.includes(event)
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20'
                          : 'bg-gray-100 text-gray-600 dark:bg-zinc-800'
                      }`}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>

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
                  إلغاء
                </button>
                <button
                  type="button" // ✅ تغيير من submit إلى button
                  onClick={handleSubmit} // ✅ استدعاء الدالة مباشرة
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                >
                  {editingPixel ? 'حفظ التعديلات' : 'إضافة Pixel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};