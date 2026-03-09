import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Store, Upload, Save, Loader2,
  Image as ImageIcon, Palette, MapPin, Mail,
  Phone, Type, CheckCircle, AlertCircle,
  Shirt, Smartphone, Home, Sparkles, ExternalLink,
  Trash2
} from 'lucide-react';
import ModelImages from '../../../components/ModelImages';
import { baseURL } from '../../../constents/const.';
import { getAccessToken, removeAccessToken } from '../../../services/access-token';
import axios from 'axios';
import { useEffect } from 'react';

const CreateFirstStore = () => {

  const [error, setError] = useState(null)
  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      const response = await axios.get(`${baseURL}/stores/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.data.length !== 0) {
        navigate('/dashboard/stores')
      }


    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(t('stores.load_failed'));
    } finally {
      setLoading(false);
    }
  };


  const { t, i18n } = useTranslation('translation', { keyPrefix: 'stores' });
  const navigate = useNavigate();
  const isRtl = i18n.dir() === 'rtl';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [activeModal, setActiveModal] = useState(null); // 'logo' | 'hero' | null

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    phone: '',
    email: '',
    wilaya: 'Algiers',
    logo: null,
    primaryColor: '#000000',
    secondaryColor: '#f59e0b',
    niche: null,
    heroImage: null,
    heroTitle: '',
    heroSubtitle: '',
    showTopBar: true,
    topBarText: '',
    currency: 'DZD',
    language: 'ar',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [niches, setNiche] = useState([]);
  const [wilayas, setWilayas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // تنفيذ الطلبين في وقت واحد لسرعة الأداء
        const [nichesRes, wilayasRes] = await Promise.all([
          axios.get(`${baseURL}/admin/niches`),
          axios.get(`${baseURL}/shipping/wilayas`)
        ]);

        setNiche(nichesRes.data);
        setWilayas(wilayasRes.data);

        console.log("Data loaded successfully");
      } catch (error) {
        console.error("Something went wrong:", error);
      }
    };

    fetchData();
  }, []);


  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const handleSelectImage = useCallback((image) => {
    if (activeModal === 'hero') {
      setHeroImagePreview(image.url);
      setFormData(prev => ({ ...prev, heroImage: image.url }));
    } else if (activeModal === 'logo') {
      setLogoPreview(image.url);
      setFormData(prev => ({ ...prev, logo: image.url }));
    }
    setActiveModal(null);
  }, [activeModal]);

  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
  }, []);

  const removeHeroImage = useCallback(() => {
    setHeroImagePreview(null);
    setFormData(prev => ({ ...prev, heroImage: null }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('form.validation.name_required');
    else if (formData.name.trim().length < 2) newErrors.name = t('form.validation.name_short');

    if (!formData.domain.trim()) newErrors.domain = t('form.validation.domain_required');
    else if (!/^[a-z0-9-]+$/.test(formData.domain)) newErrors.domain = t('form.validation.domain_invalid');
    else if (formData.domain.length < 3) newErrors.domain = t('form.validation.domain_short');

    const phone = formData.phone?.trim();
    if (phone && !/^(0)(5|6|7)[0-9]{8}$/.test(phone)) newErrors.phone = t('form.validation.phone_invalid');

    const email = formData.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t('form.validation.email_invalid');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.domain, formData.phone, formData.email, t]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification('error', t('create.form_errors'));
      return;
    }
    setLoading(true);
    try {
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
      const response = await axios.post(`${baseURL}/stores/create-full`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        showNotification('success', t('create.success'));
        setTimeout(() => navigate('/dashboard/stores'), 2000);
      }
    } catch (error) {
      console.error('Error creating store:', error);
      showNotification('error', error.response?.data?.message || t('create.failed'));
    } finally {
      setLoading(false);
    }
  }, [formData, navigate, showNotification, validateForm, t]);

  const openLogoModal = useCallback(() => setActiveModal('logo'), []);
  const openHeroModal = useCallback(() => setActiveModal('hero'), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // ─── Shared input class ───────────────────────────────────────────────────────
  const inputClass = (hasError) =>
    `w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border ${hasError ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-700'
    } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white`;

  const sectionClass = 'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6';
  const sectionTitle = 'text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2';
  const labelClass = 'block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2';

  const handleLogout = () => {
    removeAccessToken();
    navigate('/auth/login');
  };

  return (
    <div className='h-screen w-screen fixed top-0 left-0 bg-gray-50 z-50 overflow-auto' >
      <div className="max-w-5xl mx-auto px-4 py-8" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ── Notification ── */}
        {notification.show && (
          <div className={`fixed top-4 ${isRtl ? 'left-4' : 'right-4'} z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            } text-white`}>
            {notification.type === 'success'
              ? <CheckCircle size={20} />
              : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{notification.message}</span>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className='flex justify-between items-center mb-8'>
          {/* القسم الأيسر: زر الرجوع والعناوين */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:scale-105 transition-all shadow-sm"
            >
              <BackIcon size={20} />
            </button>

            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Store size={24} className="text-indigo-600" />
                {t('create.first-title')}
              </h1>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
                {t('create.subtitle')}
              </p>
            </div>
          </div>

          {/* القسم الأيمن: زر تغيير الحساب */}
          <button
            className='px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/30'
            onClick={handleLogout}
          >
            {t('create.switch_account_hint') || 'Change account'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Basic Information ── */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <Store size={20} className="text-indigo-600" />
              {t('form.basic_info')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Name */}
              <div>
                <label className={labelClass}>
                  {t('form.name_label')} <span className="text-rose-500">{t('form.required')}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('form.name_placeholder')}
                  className={inputClass(errors.name)}
                />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Domain */}
              <div>
                <label className={labelClass}>
                  {t('form.domain_label')} <span className="text-rose-500">{t('form.required')}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                    placeholder={t('form.domain_placeholder')}
                    className={`${inputClass(errors.domain)} ${isRtl ? 'pl-28' : 'pr-28'}`}
                    dir="ltr"
                  />
                  <span className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono`}>
                    .mdstore.dz
                  </span>
                </div>
                {errors.domain && <p className="text-rose-500 text-xs mt-1">{errors.domain}</p>}
              </div>

              {/* Wilaya */}
              <div>
                <label className={labelClass}>
                  <MapPin size={14} className="inline me-1" />
                  {t('form.wilaya_label')}
                </label>
                <select
                  name="wilaya"
                  value={formData.wilaya}
                  onChange={handleInputChange}
                  className={inputClass(false)}
                >
                  {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {/* Niche */}
              <div>
                <label className={labelClass}>{t('form.niche_label')}</label>
                <select
                  name="niche"
                  value={formData.niche}
                  onChange={handleInputChange}
                  className={inputClass(false)}
                >
                  {/* الخيار الافتراضي: نستخدم قيمة فارغة إذا لم يكن هناك تخصص */}
                  <option value="">🏪 {t("create.No.Specific.Niche")}</option>

                  {/* عرض قائمة التخصصات */}
                  {niches && niches.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.icon} {n.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass}>
                  <Phone size={14} className="inline me-1" />
                  {t('form.phone_label')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0557123456"
                  className={inputClass(errors.phone)}
                  dir="ltr"
                />
                {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>
                  <Mail size={14} className="inline me-1" />
                  {t('form.email_label')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className={inputClass(errors.email)}
                  dir="ltr"
                />
                {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* ── Design & Colors ── */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <Palette size={20} className="text-indigo-600" />
              {t('form.design')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div>
                <label className={labelClass}>
                  <ImageIcon size={14} className="inline me-1" />
                  {t('form.logo_label')}
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
                      className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity`}
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
                    <span className="text-sm text-gray-500">{t('form.logo_upload')}</span>
                  </button>
                )}
              </div>

              {/* Colors */}
              <div className="space-y-4">
                {[
                  { name: 'primaryColor', label: t('form.primary_color') },
                  { name: 'secondaryColor', label: t('form.secondary_color') },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name={name}
                        value={formData[name]}
                        onChange={handleInputChange}
                        className="h-12 w-20 rounded-xl cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        value={formData[name]}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Hero Section ── */}
          <div className={sectionClass}>
            <h2 className={sectionTitle}>
              <ImageIcon size={20} className="text-indigo-600" />
              {t('form.hero_section')}
            </h2>

            <div className="space-y-6">
              {/* Hero Image */}
              <div>
                <label className={labelClass}>{t('form.hero_image')}</label>
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
                      className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity`}
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
                    <span className="text-sm text-gray-500">{t('form.hero_image_btn')}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    <Type size={14} className="inline me-1" />
                    {t('form.hero_title_label')}
                  </label>
                  <input
                    type="text"
                    name="heroTitle"
                    value={formData.heroTitle}
                    onChange={handleInputChange}
                    placeholder="Your Cozy Era"
                    className={inputClass(false)}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('form.hero_subtitle_label')}</label>
                  <input
                    type="text"
                    name="heroSubtitle"
                    value={formData.heroSubtitle}
                    onChange={handleInputChange}
                    placeholder="Get peak comfy-chic..."
                    className={inputClass(false)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Top Bar ── */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('form.top_bar')}
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
                  {t('form.top_bar_enable')}
                </span>
              </label>
            </div>

            {formData.showTopBar && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>{t('form.top_bar_text')}</label>
                  <input
                    type="text"
                    name="topBarText"
                    value={formData.topBarText}
                    onChange={handleInputChange}
                    placeholder={t('form.top_bar_placeholder')}
                    className={inputClass(false)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Quick Preview ── */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('form.preview')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: t('form.preview_name'), val: formData.name || '—' },
                {
                  label: t('form.preview_domain'),
                  val: formData.domain ? `${formData.domain}.mdstore.dz` : '—',
                  extra: formData.domain ? <ExternalLink size={12} /> : null,
                  highlight: true,
                },
                { label: t('form.preview_wilaya'), val: formData.wilaya },
              ].map(({ label, val, extra, highlight }) => (
                <div key={label} className="bg-white dark:bg-zinc-900 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`font-bold truncate flex items-center gap-1 ${highlight ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>
                    {val}{extra}
                  </p>
                </div>
              ))}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: formData.primaryColor }} />
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: formData.secondaryColor }} />
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} gap-4`}>
            <button
              type="button"
              onClick={() => navigate('/dashboard/stores')}
              className="px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold text-gray-700 dark:text-zinc-300 hover:scale-105 transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" />{t('create.submitting')}</>
              ) : (
                <><Save size={20} />{t('create.submit')}</>
              )}
            </button>
          </div>
        </form>

        {/* ── Image Modal ── */}
        <ModelImages
          isOpen={!!activeModal}
          onSelectImage={handleSelectImage}
          close={closeModal}
        />
      </div>
    </div>
  );
};

export default CreateFirstStore;