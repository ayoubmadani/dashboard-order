import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Store, Upload, Save, Loader2,
  Image as ImageIcon, Palette, MapPin, Mail,
  Phone, Type, CheckCircle, AlertCircle,
  Trash2, Languages, ShoppingCart, Hash, Truck,
  Info, Sliders, LayoutTemplate,
} from 'lucide-react';
import ModelImages from '../../../components/ModelImages';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import Loading from '../../../components/Loading';
import NoStoreState from '../../../components/NoStoreState';

const SECTIONS = ['basic', 'design', 'hero', 'options'];

const CurrentStore = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'stores' });
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const isRtl = i18n.dir() === 'rtl';

  const [activeSection, setActiveSection] = useState('basic');

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFaviconModalOpen, setIsFaviconModalOpen] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [folder, setFolder] = useState();
  const [wilayas, setWilayas] = useState([]);

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
    favicon: null,
    address: '',
    cart: false,
    supportQty: true,
    supportFreeShipping: false,
    freeShippingMinAmount: '',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [heroImagePreview, setHeroImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStore, setFetchingStore] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [niches, setNiche] = useState([]);
  const [storeIsActive, setStoreIsActive] = useState(false);

  useEffect(() => {
    async function getData() {
      try {
        const [nichesRes, wilayasRes] = await Promise.all([
          axios.get(`${baseURL}/admin/niches`),
          axios.get(`${baseURL}/shipping/wilayas`),
        ]);
        setNiche(nichesRes.data);
        setWilayas(wilayasRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    getData();
  }, []);

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
  }, []);

  const fetchStoreData = useCallback(async () => {
    if (!storeId) { setFetchingStore(false); return; }
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
          niche: store.niche?.id,
          heroImage: store.hero?.imageUrl || null,
          heroTitle: store.hero?.title || '',
          heroSubtitle: store.hero?.subtitle || '',
          showTopBar: store.topBar?.enabled ?? true,
          topBarText: store.topBar?.text || '',
          topBarColor: store.topBar?.color || '#6366f1',
          currency: store.currency || 'DZD',
          language: store.language || 'ar',
          favicon: store.design?.faviconUrl || null,
          address: store.contact?.address || '',
          cart: store.cart || false,
          supportQty: store.supportQty ?? true,
          supportFreeShipping: store.supportFreeShipping ?? false,
          freeShippingMinAmount: store.freeShippingMinAmount ?? '',
        });
        setStoreIsActive(!!store.isActive);
        setLogoPreview(store.design?.logoUrl || null);
        setHeroImagePreview(store.hero?.imageUrl || null);
        setFaviconPreview(store.design?.faviconUrl || null);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
      showNotification('error', t('update.load_failed'));
    } finally {
      setFetchingStore(false);
    }
  }, [storeId, showNotification, t]);

  useEffect(() => { fetchStoreData(); }, [fetchStoreData]);

  const handleSelectImage = useCallback((image) => {
    if (isHeroModalOpen) {
      setHeroImagePreview(image.url);
      setFormData(prev => ({ ...prev, heroImage: image.url }));
      setIsHeroModalOpen(false);
    } else if (isLogoModalOpen) {
      setLogoPreview(image.url);
      setFormData(prev => ({ ...prev, logo: image.url }));
      setIsLogoModalOpen(false);
    } else if (isFaviconModalOpen) {
      setFaviconPreview(image.url);
      setFormData(prev => ({ ...prev, favicon: image.url }));
      setIsFaviconModalOpen(false);
    }
    setIsModalOpen(false);
  }, [isHeroModalOpen, isLogoModalOpen, isFaviconModalOpen]);

  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
  }, []);

  const removeFavicon = useCallback(() => {
    setFaviconPreview(null);
    setFormData(prev => ({ ...prev, favicon: null }));
  }, []);

  const removeHeroImage = useCallback(() => {
    setHeroImagePreview(null);
    setFormData(prev => ({ ...prev, heroImage: null }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('form.validation.name_required');
    else if (formData.name.trim().length < 2) newErrors.name = t('form.validation.name_short');

    const phone = formData.phone?.trim();
    if (phone && !/^(0)(5|6|7)[0-9]{8}$/.test(phone)) newErrors.phone = t('form.validation.phone_invalid');

    const email = formData.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t('form.validation.email_invalid');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.phone, formData.email, t]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('error', t('form.form_errors'));
      setActiveSection('basic');
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
          nicheId: formData.niche || null,
          cart: formData.cart || false,
          supportQty: formData.supportQty,
          supportFreeShipping: formData.supportFreeShipping,
          freeShippingMinAmount: formData.supportFreeShipping
            ? (formData.freeShippingMinAmount === '' ? null : Number(formData.freeShippingMinAmount))
            : null,
        },
        design: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logo,
          faviconUrl: formData.favicon,
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
          address: formData.address,
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

      if (response.status == 200 || response.status == 201) {
        showNotification('success', t('update.success'));
      }
    } catch (error) {
      console.error('Error updating store:', error);
      const errorMessage = error.response?.data?.message || t('update.failed');
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, storeId, showNotification, validateForm, errors, t]);

  const openLogoModal = useCallback(() => {
    setFolder('logo');
    setIsLogoModalOpen(true);
    setIsHeroModalOpen(false);
    setIsModalOpen(true);
  }, []);

  const openHeroModal = useCallback(() => {
    setFolder('hero');
    setIsHeroModalOpen(true);
    setIsLogoModalOpen(false);
    setIsModalOpen(true);
  }, []);

  const openFaviconModal = useCallback(() => {
    setFolder('favicon');
    setIsFaviconModalOpen(true);
    setIsLogoModalOpen(false);
    setIsHeroModalOpen(false);
    setIsModalOpen(true);
  }, []);

  // ─── Shared classes ───────────────────────────────────────────────────────────
  const inputClass = (hasError) =>
    `w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border ${hasError ? 'border-rose-500' : 'border-gray-200 dark:border-zinc-700'
    } rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-gray-900 dark:text-white`;

  const labelClass = 'block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2';

  const sections = [
    { id: 'basic', label: t('form.basic_info'), icon: Info },
    { id: 'design', label: t('form.design'), icon: Palette },
    { id: 'hero', label: t('form.hero_section'), icon: LayoutTemplate },
    { id: 'options', label: t('form.top_bar'), icon: Sliders },
  ];

  if (fetchingStore) {
    return <Loading />;
  }

  if (!storeId) {
    return (
      <NoStoreState
        title={t('no_store.title')}
        subtitle={t('no_store.subtitle')}
        cta={t('no_store.cta')}
        isRtl={isRtl}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Notification ── */}
      {notification.show && (
        <div className={`fixed top-4 ${isRtl ? 'left-4' : 'right-4'} z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* ── Identity banner ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 p-8 mb-6 shadow-xl shadow-indigo-500/20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-black text-white shrink-0 overflow-hidden border border-white/20">
            {logoPreview ? (
              <img src={logoPreview} alt={formData.name} className="w-full h-full object-contain p-1.5" />
            ) : (
              formData.name?.charAt(0)?.toUpperCase() || <Store size={26} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-white truncate">{formData.name || t('update.title')}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${storeIsActive ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/15 text-white/70'}`}>
                {storeIsActive ? t('common.active') : t('common.inactive')}
              </span>
            </div>
            {formData.domain && (
              <a
                href={`https://${formData.domain}.mdstore.top`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                {formData.domain}.mdstore.top
              </a>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Section pills ── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 ${activeSection === id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── Section content ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-gray-100 dark:border-zinc-800 p-6 shadow-sm min-h-[360px]">

          {activeSection === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    {t('form.name_label')} <span className="text-rose-500">{t('form.required')}</span>
                  </label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleInputChange}
                    placeholder={t('form.name_placeholder')} className={inputClass(errors.name)}
                  />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('form.niche_label')}</label>
                  <select name="niche" value={formData.niche} onChange={handleInputChange} className={inputClass(false)}>
                    <option value="">🏪 {t('form.create.No.Specific.Niche')}</option>
                    {niches && niches.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.icon} {i18n.language === 'ar' ? n.name_ar : i18n.language === 'fr' ? n.name_fr : n.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><MapPin size={14} className="inline me-1" />{t('form.address_label')}</label>
                  <input
                    type="text" name="address" value={formData.address} onChange={handleInputChange}
                    placeholder={t('form.address_placeholder')} className={inputClass(errors.address)}
                  />
                </div>
                <div>
                  <label className={labelClass}><MapPin size={14} className="inline me-1" />{t('form.wilaya_label')}</label>
                  <select name="wilaya" value={formData.wilaya} onChange={handleInputChange} className={inputClass(false)}>
                    <option value="">...</option>
                    {wilayas.map((w) => <option key={w.id} value={w.name}>({w.id}) {w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><Phone size={14} className="inline me-1" />{t('form.phone_label')}</label>
                  <input
                    type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                    placeholder="0557123456" className={inputClass(errors.phone)} dir="ltr"
                  />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className={labelClass}><Mail size={14} className="inline me-1" />{t('form.email_label')}</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="example@email.com" className={inputClass(errors.email)} dir="ltr"
                  />
                  {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}><Languages size={14} className="inline me-1" />{t('form.language_label')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'ar', label: 'العربية', code: 'AR' },
                    { value: 'fr', label: 'Français', code: 'FR' },
                    { value: 'en', label: 'English', code: 'EN' },
                  ].map((lang) => {
                    const active = formData.language === lang.value;
                    return (
                      <button
                        key={lang.value} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, language: lang.value }))}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 transition-all ${active
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                          }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-violet-500' : 'border-gray-300 dark:border-zinc-600'}`}>
                          {active && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                        </span>
                        <span className={`text-sm font-semibold ${active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-700 dark:text-zinc-300'}`}>{lang.label}</span>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">{lang.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'design' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><ImageIcon size={14} className="inline me-1" />{t('form.logo_label')}</label>
                  {logoPreview ? (
                    <div className="relative group">
                      <img src={logoPreview} alt="Logo" className="w-full h-36 object-contain bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700" />
                      <button type="button" onClick={removeLogo} className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={openLogoModal} className="w-full h-36 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-violet-500 transition-colors flex flex-col items-center justify-center gap-2 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 group">
                      <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon size={20} className="text-violet-500" />
                      </div>
                      <span className="text-sm text-gray-500">{t('form.logo_upload')}</span>
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelClass}><ImageIcon size={14} className="inline me-1" />{t('form.favicon_label')}</label>
                  {faviconPreview ? (
                    <div className="relative group">
                      <img src={faviconPreview} alt="Favicon" className="w-full h-36 object-contain bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700" />
                      <button type="button" onClick={removeFavicon} className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={openFaviconModal} className="w-full h-36 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-violet-500 transition-colors flex flex-col items-center justify-center gap-2 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 group">
                      <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon size={20} className="text-violet-500" />
                      </div>
                      <span className="text-sm text-gray-500">{t('form.favicon_upload')}</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">32×32 px</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'primaryColor', label: t('form.primary_color') },
                  { name: 'secondaryColor', label: t('form.secondary_color') },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    <div className="flex items-center gap-3">
                      <input type="color" name={name} value={formData[name]} onChange={handleInputChange} className="h-12 w-16 rounded-xl cursor-pointer border-0 p-1 bg-gray-50 dark:bg-zinc-800" />
                      <input type="text" value={formData[name]} readOnly className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-sm text-gray-900 dark:text-white" />
                      <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-zinc-700 shrink-0" style={{ backgroundColor: formData[name] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'hero' && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>{t('form.hero_image')}</label>
                {heroImagePreview ? (
                  <div className="relative group">
                    <img src={heroImagePreview} alt="Hero" className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-zinc-700" />
                    <button type="button" onClick={removeHeroImage} className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={openHeroModal} className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl hover:border-violet-500 transition-colors flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-500">{t('form.hero_image_btn')}</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><Type size={14} className="inline me-1" />{t('form.hero_title_label')}</label>
                  <input type="text" name="heroTitle" value={formData.heroTitle} onChange={handleInputChange} placeholder="Your Cozy Era" className={inputClass(false)} />
                </div>
                <div>
                  <label className={labelClass}>{t('form.hero_subtitle_label')}</label>
                  <input type="text" name="heroSubtitle" value={formData.heroSubtitle} onChange={handleInputChange} placeholder="Get peak comfy-chic..." className={inputClass(false)} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'options' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 p-4 bg-violet-50/50 dark:bg-zinc-800/50 rounded-2xl border border-violet-100 dark:border-zinc-700">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('form.top_bar')}</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('form.top_bar_enable')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showTopBar: !prev.showTopBar }))}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ${formData.showTopBar ? 'bg-violet-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.showTopBar ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')}`} />
                </button>
              </div>
              {formData.showTopBar && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={labelClass}>{t('form.top_bar_text')}</label>
                  <input type="text" name="topBarText" value={formData.topBarText} onChange={handleInputChange} placeholder={t('form.top_bar_placeholder')} className={inputClass(false)} />
                </div>
              )}

              <div className="flex items-center justify-between gap-3 p-4 bg-violet-50/50 dark:bg-zinc-800/50 rounded-2xl border border-violet-100 dark:border-zinc-700">
                <div className="flex items-center gap-3 min-w-0">
                  <ShoppingCart size={20} className="text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('form.cart_support_label')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('form.cart_support_description')}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, cart: !prev.cart }))} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ${formData.cart ? 'bg-violet-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.cart ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 p-4 bg-violet-50/50 dark:bg-zinc-800/50 rounded-2xl border border-violet-100 dark:border-zinc-700">
                <div className="flex items-center gap-3 min-w-0">
                  <Hash size={20} className="text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('form.qty_support_label')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('form.qty_support_description')}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, supportQty: !prev.supportQty }))} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ${formData.supportQty ? 'bg-violet-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.supportQty ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')}`} />
                </button>
              </div>

              <div className="p-4 bg-violet-50/50 dark:bg-zinc-800/50 rounded-2xl border border-violet-100 dark:border-zinc-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Truck size={20} className="text-violet-500 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('form.free_shipping_support_label')}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{t('form.free_shipping_support_description')}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, supportFreeShipping: !prev.supportFreeShipping }))} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ${formData.supportFreeShipping ? 'bg-violet-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.supportFreeShipping ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')}`} />
                  </button>
                </div>
                {formData.supportFreeShipping && (
                  <div className="mt-4 pt-4 border-t border-violet-100 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2">
                    <label className={labelClass}>{t('form.free_shipping_min_amount_label')}</label>
                    <input type="number" min="0" step="0.01" name="freeShippingMinAmount" value={formData.freeShippingMinAmount} onChange={handleInputChange} placeholder={t('form.free_shipping_min_amount_placeholder')} className={inputClass(false)} dir="ltr" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} gap-4 mt-6`}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings/stores')}
            className="px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold text-gray-700 dark:text-zinc-300 hover:scale-105 transition-all"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" />{t('update.submitting')}</>
            ) : (
              <><Save size={20} />{t('update.submit')}</>
            )}
          </button>
        </div>
      </form>

      {/* ── Image Modal ── */}
      <ModelImages
        isOpen={isModalOpen}
        onSelectImage={handleSelectImage}
        close={() => setIsModalOpen(false)}
        initialFolder={folder}
      />
    </div>
  );
};

export default CurrentStore;
