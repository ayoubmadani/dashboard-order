import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Image as ImageIcon,
  X, Search,
  Wand2, ArrowLeft, Check,
  Loader2, ChevronDown, Globe, Copy, Package
} from 'lucide-react';
import ModelImages from '../../../components/ModelImages';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

const CreateLandingPage = () => {
  // استخدام keyPrefix لتبسيط المفاتيح مثل t('title') بدلاً من t('landing.title')
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing.create' });
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  // States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [platform, setPlatform] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [products, setProducts] = useState([]);
  const [aiGeneratedOptions, setAiGeneratedOptions] = useState(null);

  const storeId = localStorage.getItem('storeId');
  const token = getAccessToken();

  useEffect(() => {
    const getProduct = async () => {
      try {
        const response = await axios.get(`${baseURL}/stores/${storeId}/products`, {
          headers: { Authorization: `bearer ${token}` }
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
    if (storeId) getProduct();
  }, [storeId, token]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
    setSelectedImage(null);
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image.url);
    setIsImageModalOpen(false);
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setIsGenerating(true);
    setAiGeneratedOptions(null);

    try {
      const { data } = await axios.post(
        `${baseURL}/landing-page/generate-product-image/${selectedProduct.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setSelectedImage(data.imageUrl);
        setAiGeneratedOptions({
          marketingContent: data.marketingContent,
          image: data.image,
        });
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert(t('ai_error_msg') || 'AI Generation Failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedProduct || !selectedImage || !domain) return;
    setIsPublishing(true);

    const payload = {
      productId: selectedProduct.id,
      urlImage: selectedImage,
      domain: domain,
      platform: platform, // تم تصحيح الخطأ الإملائي من paltform إلى platform
    };

    try {
      const response = await axios.post(`${baseURL}/landing-page`, payload, {
        headers: { Authorization: `bearer ${token}` }
      });

      if (response.data.success) {
        alert(t('publish_success_msg') || 'Published Successfully!');
        navigate('/dashboard/landing-pages');
      }
    } catch (error) {
      alert(error.response.data.message)
    } finally {
      setIsPublishing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat(isRtl ? 'ar-DZ' : 'en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className={`text-gray-600 dark:text-zinc-400 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('create_title') || 'Create Landing Page'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* 1. Creator Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">{t('product_selection_title') || 'Product Details'}</h2>

            {/* Product Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                {t('select_product_label') || 'Select Product'}
              </label>
              {selectedProduct ? (
                <div onClick={() => setIsProductModalOpen(true)} className="cursor-pointer flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 break-words" title={selectedProduct.name}>
                      {selectedProduct.name}
                    </h3>                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">{formatPrice(selectedProduct.price)}</p>
                  </div>
                  <button  className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg">
                    <ChevronDown size={20} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsProductModalOpen(true)} className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex items-center justify-between text-gray-500 hover:border-indigo-500 transition-all">
                  <span>{t('select_product_placeholder') || 'Choose a product...'}</span>
                  <ChevronDown size={20} />
                </button>
              )}
            </div>

            {/* AI Generator Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedProduct || isGenerating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <><Loader2 size={20} className="animate-spin" /> {t('generating_ai') || 'Generating...'}</>
              ) : (
                <><Sparkles size={20} /> {t('generate_with_ai') || 'Generate with AI'}</>
              )}
            </button>

            {aiGeneratedOptions && (
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                  <Wand2 size={16} /> {t('ai_success_title') || 'Generated Successfully!'}
                </h3>
                {aiGeneratedOptions.marketingContent && (
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                      <p className="font-bold text-gray-900 dark:text-white">{aiGeneratedOptions.marketingContent.headline}</p>
                      <p className="text-gray-500 text-xs mt-1">{aiGeneratedOptions.marketingContent.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
              <span className="text-sm text-gray-400 font-medium">{t('or_manual') || 'OR'}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
            </div>

            <button onClick={() => setIsImageModalOpen(true)} className="w-full mb-6 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-zinc-300 hover:border-indigo-500 transition-all">
              <ImageIcon size={20} /> {t('select_from_library') || 'Media Library'}
            </button>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t('domain_name') || 'Domain Name'}</label>
                <div className="relative">
                  <Globe className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="example-page"
                    className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t('platform') || 'Platform'}</label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="Facebook / TikTok"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={!selectedProduct || !selectedImage || !domain || isPublishing}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isPublishing ? <><Loader2 size={20} className="animate-spin" /> {t('publishing_btn') || 'Publishing...'}</> : <><Check size={20} /> {t('publish_btn') || 'Publish Page'}</>}
            </button>
          </div>

          {/* 2. Preview Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800 sticky top-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">{t('live_preview') || 'Live Preview'}</h2>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center" style={{ aspectRatio: '9/16' }}>
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">{t('preview_placeholder') || 'Select an image to see preview'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('select_product_title') || 'Products'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder') || 'Search...'}
                  className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-200"
                    >
                      <img src={product.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 break-words max-w-full">
                          {product.name}
                        </h3>                        <p className="text-sm text-indigo-600">{formatPrice(product.price)}</p>
                      </div>
                      {selectedProduct?.id === product.id && <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('no_products') || 'No products found'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ModelImages
        isOpen={isImageModalOpen}
        close={() => setIsImageModalOpen(false)}
        onSelectImage={handleImageSelect}
      />
    </div>
  );
};

export default CreateLandingPage;