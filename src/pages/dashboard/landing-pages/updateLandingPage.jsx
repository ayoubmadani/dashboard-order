import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles, Image as ImageIcon, ArrowLeft, Check,
  Loader2, Globe, Package, Type, DollarSign,
  Link2, ExternalLink, Wand2, X, Search, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import ModelImages from '../../../components/ModelImages';

const getProductImage = (page) =>
  page.urlImage ||
  page.product?.productImage ||
  page.product?.imagesProduct?.[0]?.imageUrl ||
  null;

const UpdateLandingPage = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing' });
  const navigate = useNavigate();
  const { id } = useParams();
  const isRtl = i18n.language === 'ar';
  const currentLang = i18n.language;

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiGeneratedOptions, setAiGeneratedOptions] = useState(null);

  // ✅ إصلاح: إضافة selectedDomain و pageName مثل CreateLandingPage
  const [selectedDomain, setSelectedDomain] = useState('');
  const [pageName, setPageName] = useState('');

  const [formData, setFormData] = useState({
    domain: '',
    platform: '',
    status: 'active',
    urlImage: '',
    product: {
      id: null,
      name: '',
      price: '',
      description: '',
      image: ''
    }
  });

  const [products, setProducts] = useState([]);
  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');

  // ✅ نفس قائمة الدومينات في CreateLandingPage
  const listDomain = [
    { domain: "shamsou-game.mdstore.top" },
    { domain: "shamsou2-game.mdstore.top" },
    { domain: "shamsou3-game.mdstore.top" },
  ];

  /* ── Fetch Products ── */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${baseURL}/stores/${storeId}/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const listProduct = response.data.products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.imagesProduct[0]?.imageUrl
        }));
        setProducts(listProduct);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    if (storeId) fetchProducts();
  }, [storeId, token]);

  /* ── Fetch Page Data ── */
  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/landing-page/get-one/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const page = res.data.data || res.data;
      
      // ✅ إصلاح: تقسيم الدومين إلى selectedDomain و pageName
      const fullDomain = page.domain || '';
      let initialDomain = '';
      let initialPageName = '';

      // محاولة استخراج الدومين واسم الصفحة من الرابط الكامل
      if (fullDomain) {
        const domainMatch = listDomain.find(d => fullDomain.includes(d.domain));
        if (domainMatch) {
          initialDomain = domainMatch.domain;
          // استخراج اسم الصفحة بعد /lp/
          const pageNameMatch = fullDomain.match(/\/lp\/(.+)$/);
          initialPageName = pageNameMatch ? pageNameMatch[1] : '';
        } else {
          // إذا لم يتم العثور على تطابق، نضع القيمة كاملة في pageName
          initialPageName = fullDomain;
        }
      }

      setSelectedDomain(initialDomain);
      setPageName(initialPageName);

      setFormData({
        domain: fullDomain,
        platform: page.platform || '',
        status: page.status || 'active',
        urlImage: page.urlImage || '',
        product: {
          id: page.product?.id || null,
          name: page.product?.name || '',
          price: page.product?.price || '',
          description: page.product?.description || '',
          image: getProductImage(page) || ''
        }
      });
    } catch (err) {
      console.error('Failed to fetch page:', err);
      alert(t('update.fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [id, token, t]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  /* ── Handlers ── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name.startsWith('product.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        product: { ...prev.product, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleOpenProductModal = useCallback(() => {
    setIsProductModalOpen(true);
    setSearchQuery('');
  }, []);

  const handleSelectProduct = useCallback((product) => {
    setFormData(prev => ({
      ...prev,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: prev.product.description || '',
        image: product.image
      }
    }));
    setIsProductModalOpen(false);
    setSearchQuery('');
  }, []);

  const handleImageSelect = useCallback((image) => {
    setFormData(prev => ({ ...prev, urlImage: image.url }));
    setIsImageModalOpen(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!formData.product.id) return;
    setIsGenerating(true);
    setAiGeneratedOptions(null);

    try {
      const { data } = await axios.post(
        `${baseURL}/landing-page/generate-product-image/${formData.product.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setFormData(prev => ({ ...prev, urlImage: data.imageUrl }));
        setAiGeneratedOptions({
          marketingContent: data.marketingContent,
          image: data.image
        });
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert(t('update.generate_error'));
    } finally {
      setIsGenerating(false);
    }
  }, [formData.product.id, token, t]);

  const handleSave = useCallback(async () => {
    // ✅ إصلاح: التحقق من selectedDomain و pageName مثل CreateLandingPage
    if (!selectedDomain || !pageName || !formData.product.id) {
      alert(t('update.fill_required') || 'Please fill all required fields');
      return;
    }

    setSaving(true);

    // ✅ إصلاح: تنسيق الرابط بشكل صحيح
    const fullDomain = `${selectedDomain}/lp/${pageName}`;

    try {
      await axios.patch(`${baseURL}/landing-page/${id}`, {
        domain: fullDomain, // ✅ إرسال الرابط الكامل
        platform: formData.platform,
        urlImage: formData.urlImage,
        productId: formData.product.id
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert(t('update.success'));
      navigate('/dashboard/landing-pages');
    } catch (err) {
      console.error('Update failed:', err);
      alert(err.response?.data?.message || t('update.save_error'));
    } finally {
      setSaving(false);
    }
  }, [id, formData, selectedDomain, pageName, token, t, navigate]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-DZ' : 'en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 rounded-full animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-purple-600" size={24} />
          </div>
          <p className="text-gray-500 dark:text-zinc-400 font-medium">{t('update.loading')}</p>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard/landing-pages')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className={`text-gray-600 dark:text-zinc-400 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('update.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* 1. Editor Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">{t('update.editor_title')}</h2>

            {/* Product Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                {t('update.select_product')}
              </label>
              {formData.product.name ? (
                <div 
                  onClick={handleOpenProductModal}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 cursor-pointer hover:border-purple-500 transition-all"
                >
                  <img src={formData.product.image} alt={formData.product.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{formData.product.name}</h3>
                    <p className="text-sm text-purple-600 font-semibold">{formatPrice(formData.product.price)}</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-purple-600 rounded-lg">
                    <ChevronDown size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleOpenProductModal}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex items-center justify-between text-gray-500 hover:border-purple-500 transition-all"
                >
                  <span>{t('update.select_product')}</span>
                  <ChevronDown size={20} />
                </button>
              )}
            </div>

            {/* AI Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!formData.product.id || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 mb-6"
            >
              {isGenerating ? (
                <><Loader2 size={20} className="animate-spin" /> {t('update.generating')}</>
              ) : (
                <><Sparkles size={20} /> {t('update.generate_ai')}</>
              )}
            </button>

            {/* AI Generated Content */}
            {aiGeneratedOptions && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-500/30 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <Wand2 size={16} /> {t('update.ai_success')}
                </h3>
                {aiGeneratedOptions.marketingContent && (
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                      <p className="font-bold text-gray-900 dark:text-white">{aiGeneratedOptions.marketingContent.headline}</p>
                      <p className="text-gray-500 text-xs mt-1">{aiGeneratedOptions.marketingContent.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiGeneratedOptions.marketingContent.features?.map((f, i) => (
                        <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
              <span className="text-sm text-gray-400 font-medium">{t('common.or')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
            </div>

            {/* Media Library */}
            <button 
              onClick={() => setIsImageModalOpen(true)} 
              className="w-full mb-6 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-zinc-300 hover:border-purple-500 transition-all"
            >
              <ImageIcon size={20} /> {t('update.media_library')}
            </button>

            {/* ✅ Inputs - نفس تصميم CreateLandingPage */}
            <div className="space-y-4 mb-8">
              {/* Domain - نفس CreateLandingPage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  {t('update.domain') || 'Domain Name'}
                </label>
                <div className={`relative flex items-stretch ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* أيقونة الكرة الأرضية */}
                  <Globe
                    className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 z-10`}
                    size={18}
                  />

                  {/* قائمة اختيار الدومين */}
                  <div className="relative flex-shrink-0 min-w-[140px]">
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className={`h-full w-full appearance-none ${isRtl ? 'pr-10 pl-8 rounded-r-xl border-l-0' : 'pl-10 pr-8 rounded-l-xl border-r-0'} py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 focus:ring-2 focus:ring-purple-500 outline-none dark:text-white cursor-pointer text-sm transition-all`}
                    >
                      <option value="">Select domain...</option>
                      {listDomain.map((item) => (
                        <option key={item.domain} value={item.domain}>
                          {item.domain}/lp/
                        </option>
                      ))}
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'left-2' : 'right-2'} flex items-center text-gray-400`}>
                      <ChevronDown size={14} />
                    </div>
                  </div>

                  {/* حقل إدخال اسم الصفحة */}
                  <input
                    type="text"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="example-page"
                    className={`w-full py-3 px-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 ${isRtl ? 'rounded-l-xl' : 'rounded-r-xl'} focus:ring-2 focus:ring-purple-500 outline-none dark:text-white`}
                  />
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t('update.platform')}</label>
                <div className="relative">
                  <Package className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                  <input 
                    type="text" 
                    name="platform"
                    value={formData.platform} 
                    onChange={handleChange}
                    placeholder="Facebook / TikTok" 
                    className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white`}
                  />
                </div>
              </div>
            </div>

            {/* Save Button - ✅ إصلاح: التحقق من selectedDomain و pageName */}
            <button
              onClick={handleSave}
              disabled={saving || !selectedDomain || !pageName || !formData.product.id}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={20} className="animate-spin" /> {t('update.saving')}</> : <><Check size={20} /> {t('update.save')}</>}
            </button>
          </div>

          {/* 2. Preview Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800 sticky top-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">{t('update.preview')}</h2>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center" style={{ aspectRatio: '9/16' }}>
              {formData.urlImage ? (
                <img src={formData.urlImage} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">{t('update.select_image')}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Product Selection Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('update.select_product')}</h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('update.search_products')}
                  className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:text-white`}
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-500/30 transition-all"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <h3 className="font-semibold line-clamp-1 text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-purple-600">{formatPrice(product.price)}</p>
                      </div>
                      {formData.product?.id === product.id && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('update.no_products')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      <ModelImages
        isOpen={isImageModalOpen}
        close={() => setIsImageModalOpen(false)}
        onSelectImage={handleImageSelect}
        initialFolder='landingPage'
      />
    </div>
  );
};

export default UpdateLandingPage;