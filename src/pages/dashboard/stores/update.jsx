import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, Store, Upload, Save, Loader2,
  Image as ImageIcon, Palette, MapPin, Mail,
  Phone, Type, CheckCircle, AlertCircle,
  Shirt, Smartphone, Home, Sparkles, Trash2
} from 'lucide-react';
import ModelImages from '../../../components/ModelImages';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import { PixelManager } from '../../../components/PixelManager';

const UpdateStore = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id: storeId } = useParams();
  const isRtl = i18n.dir() === 'rtl';

  // Modal states
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    phone: '',
    email: '',
    wilaya: 'Algiers',
    logo: null,
    primaryColor: '#000000',
    secondaryColor: '#f59e0b',
    niche: '87e5264c-627c-44ea-92e5-7363cf6efc3b',
    heroImage: null,
    heroTitle: '',
    heroSubtitle: '',
    showTopBar: true,
    topBarText: '',
    topBarColor: '#6366f1',
    currency: 'DZD',
    language: 'ar',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStore, setFetchingStore] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const niches = [
    { id: '87e5264c-627c-44ea-92e5-7363cf6efc3b', label: 'أزياء', icon: <Shirt size={20} /> },
    { id: 'electronics', label: 'إلكترونيات', icon: <Smartphone size={20} /> },
    { id: 'home', label: 'منزل وديكور', icon: <Home size={20} /> },
    { id: 'beauty', label: 'تجميل', icon: <Sparkles size={20} /> },
  ];

  const wilayas = [
    'Algiers', 'Oran', 'Constantine', 'Setif', 'Annaba', 'Blida',
    'Batna', 'Tlemcen', 'Béjaïa', 'Tizi Ouzou'
  ];

  // Show notification helper
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  }, []);

  // Fetch store data
  const fetchStoreData = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setFetchingStore(true);
      const token = getAccessToken();
      const response = await axios.get(`${baseURL}/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const store = response.data.data;
        
        setFormData({
          name: store.name || '',
          domain: store.subdomain || '',
          phone: store.contact?.phone || '',
          email: store.contact?.email || '',
          wilaya: store.contact?.wilaya || 'Algiers',
          logo: store.design?.logoUrl || null,
          primaryColor: store.design?.primaryColor || '#000000',
          secondaryColor: store.design?.secondaryColor || '#f59e0b',
          niche: store.niche?.id || '87e5264c-627c-44ea-92e5-7363cf6efc3b',
          heroImage: store.hero?.imageUrl || null,
          heroTitle: store.hero?.title || '',
          heroSubtitle: store.hero?.subtitle || '',
          showTopBar: store.topBar?.enabled ?? true,
          topBarText: store.topBar?.text || '',
          topBarColor: store.topBar?.color || '#6366f1',
          currency: store.currency || 'DZD',
          language: store.language || 'ar',
        });

        setLogoPreview(store.design?.logoUrl || null);
        setHeroImagePreview(store.hero?.imageUrl || null);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
      showNotification('error', 'فشل تحميل بيانات المتجر');
    } finally {
      setFetchingStore(false);
    }
  }, [storeId, showNotification]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Handle image selection from modal
  const handleSelectImage = useCallback((image) => {
    if (isHeroModalOpen) {
      setHeroImagePreview(image.url);
      setFormData(prev => ({ ...prev, heroImage: image.url }));
      setIsHeroModalOpen(false);
    } else if (isLogoModalOpen) {
      setLogoPreview(image.url);
      setFormData(prev => ({ ...prev, logo: image.url }));
      setIsLogoModalOpen(false);
    }
    setIsModalOpen(false);
  }, [isHeroModalOpen, isLogoModalOpen]);

  // Remove images
  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
  }, []);

  const removeHeroImage = useCallback(() => {
    setHeroImagePreview(null);
    setFormData(prev => ({ ...prev, heroImage: null }));
  }, []);

  // Form validation - محسن
  const validateForm = useCallback(() => {
    const newErrors = {};

    // اسم المتجر
    if (!formData.name.trim()) {
      newErrors.name = 'اسم المتجر مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'الاسم قصير جداً (حرفين على الأقل)';
    }

    // الدومين
    if (!formData.domain.trim()) {
      newErrors.domain = 'الدومين مطلوب';
    } else if (!/^[a-z0-9-]+$/.test(formData.domain)) {
      newErrors.domain = 'الدومين يجب أن يحتوي على حروف صغيرة وأرقام وشرطات فقط';
    }

    // الهاتف (اختياري لكن يجب أن يكون صحيحاً إذا exist)
    const phone = formData.phone?.trim();
    if (phone && !/^(0)(5|6|7)[0-9]{8}$/.test(phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح (مثال: 0557123456)';
    }

    // البريد الإلكتروني (اختياري لكن يجب أن يكون صحيحاً إذا exist)
    const email = formData.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.domain, formData.phone, formData.email]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Submit form
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('error', 'يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setLoading(true);

    try {
      // تحضير البيانات - تنظيف القيم الفارغة
      const payload = {
        store: {
          name: formData.name.trim(),
          subdomain: formData.domain.trim().toLowerCase(),
          currency: formData.currency,
          language: formData.language,
          nicheId: formData.niche,
        },
        design: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logo,
        },
        topBar: {
          enabled: formData.showTopBar,
          text: formData.topBarText.trim(),
          color: formData.primaryColor,
        },
        contact: {
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          wilaya: formData.wilaya,
        },
        hero: {
          imageUrl: formData.heroImage,
          title: formData.heroTitle.trim(),
          subtitle: formData.heroSubtitle.trim(),
        },
      };

      const token = getAccessToken();
      const response = await axios.patch(
        `${baseURL}/stores/${storeId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showNotification('success', 'تم تحديث المتجر بنجاح! 🎉');
        setTimeout(() => navigate('/dashboard/stores'), 2000);
      }
    } catch (error) {
      console.error('Error updating store:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ في تحديث المتجر';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, storeId, navigate, showNotification, validateForm]);

  // Open modals
  const openLogoModal = useCallback(() => {
    setIsLogoModalOpen(true);
    setIsHeroModalOpen(false);
    setIsModalOpen(true);
  }, []);

  const openHeroModal = useCallback(() => {
    setIsLogoModalOpen(false);
    setIsHeroModalOpen(true);
    setIsModalOpen(true);
  }, []);

  // Loading state
  if (fetchingStore) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600 dark:text-zinc-400">جاري تحميل بيانات المتجر...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard/stores')}
          className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:scale-105 transition-all"
        >
          <ArrowRight className={isRtl ? 'rotate-180' : ''} size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Store size={28} className="text-indigo-600" />
            تحديث المتجر
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            تعديل معلومات المتجر
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات أساسية */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Store size={20} className="text-indigo-600" />
            معلومات المتجر الأساسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اسم المتجر */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                اسم المتجر *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثال: متجر الأزياء"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border ${
                  errors.name ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-700'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* الدومين */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                الدومين *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  placeholder="mystore"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border ${
                    errors.domain ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-700'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ltr`}
                  dir="ltr"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  .mdstore.dz
                </span>
              </div>
              {errors.domain && <p className="text-rose-500 text-xs mt-1">{errors.domain}</p>}
            </div>

            {/* الولاية */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                <MapPin size={16} className="inline mx-1" />
                الولاية
              </label>
              <select
                name="wilaya"
                value={formData.wilaya}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wilayas.map((wilaya) => (
                  <option key={wilaya} value={wilaya}>{wilaya}</option>
                ))}
              </select>
            </div>

            {/* التصنيف */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                التصنيف
              </label>
              <select
                name="niche"
                value={formData.niche}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {niches.map((niche) => (
                  <option key={niche.id} value={niche.id}>{niche.label}</option>
                ))}
              </select>
            </div>

            {/* الهاتف */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                <Phone size={16} className="inline mx-1" />
                رقم الهاتف
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0557123456"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border ${
                  errors.phone ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-700'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left ltr`}
                dir="ltr"
              />
              {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                <Mail size={16} className="inline mx-1" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border ${
                  errors.email ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-700'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left ltr`}
                dir="ltr"
              />
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* التصميم */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Palette size={20} className="text-indigo-600" />
            التصميم والألوان
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                <ImageIcon size={16} className="inline mx-1" />
                اللوغو
              </label>
              {logoPreview ? (
                <div className="relative group">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-32 object-contain bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openLogoModal}
                  className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-indigo-500 transition-colors flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-sm text-gray-500">اختر لوغو</span>
                </button>
              )}
            </div>

            {/* الألوان */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  اللون الأساسي
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleInputChange}
                    className="h-12 w-20 rounded-xl cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  اللون الثانوي
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleInputChange}
                    className="h-12 w-20 rounded-xl cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ImageIcon size={20} className="text-indigo-600" />
            القسم الرئيسي (Hero)
          </h2>

          <div className="space-y-6">
            {/* Hero Image */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                الصورة الرئيسية
              </label>
              {heroImagePreview ? (
                <div className="relative group">
                  <img
                    src={heroImagePreview}
                    alt="Hero"
                    className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={removeHeroImage}
                    className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openHeroModal}
                  className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-indigo-500 transition-colors flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-500">اختر صورة رئيسية</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hero Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  <Type size={16} className="inline mx-1" />
                  العنوان الرئيسي
                </label>
                <input
                  type="text"
                  name="heroTitle"
                  value={formData.heroTitle}
                  onChange={handleInputChange}
                  placeholder="Your Cozy Era"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Hero Subtitle */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  العنوان الفرعي
                </label>
                <input
                  type="text"
                  name="heroSubtitle"
                  value={formData.heroSubtitle}
                  onChange={handleInputChange}
                  placeholder="Get peak comfy-chic..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* الشريط العلوي */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              الشريط العلوي
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showTopBar"
                checked={formData.showTopBar}
                onChange={handleInputChange}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                تفعيل
              </span>
            </label>
          </div>

          {formData.showTopBar && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  النص
                </label>
                <input
                  type="text"
                  name="topBarText"
                  value={formData.topBarText}
                  onChange={handleInputChange}
                  placeholder="شحن مجاني للطلبات أكثر من 5000 دج 🎉"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2">
                  اللون
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="topBarColor"
                    value={formData.topBarColor}
                    onChange={handleInputChange}
                    className="h-12 w-20 rounded-xl cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.topBarColor}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <PixelManager storeId={storeId} />

        {/* أزرار الحفظ */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/stores')}
            className="px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold hover:scale-105 transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <Save size={20} />
                حفظ التعديلات
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modals */}
      <ModelImages
        isOpen={isModalOpen}
        onSelectImage={handleSelectImage}
        close={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default UpdateStore;