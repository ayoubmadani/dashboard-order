import React, { useState } from 'react';
import {
  Sparkles, Image as ImageIcon,
  X, Search,
  Wand2, ArrowLeft, Check,
  Loader2, ChevronDown, Globe
} from 'lucide-react';
import ModelImages from '../../../components/ModelImages';
import { useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const CreateLandingPage = () => {
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
  // داخل States
  const [aiGeneratedOptions, setAiGeneratedOptions] = useState(null); // لتخزين الصور الثلاث
  const storeId = localStorage.getItem('storeId')
  const token = getAccessToken()

  // إضافة تنبيه بسيط عند الخطأ في جلب المنتجات
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
          image: p.imagesProduct[0]?.imageUrl // تأكد من وجود صورة لتجنب Error
        }));
        setProducts(listProduct);
      } catch (error) {
        console.error("Error fetching products:", error);
        // هنا يمكنك إضافة Toast.error("فشل تحميل المنتجات");
      }
    };
    if (storeId) getProduct();
  }, [storeId, token]);

  // Filter products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle product selection
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
    setSelectedImage(null); // Reset image when product changes
  };

  // Handle image selection from ModelImages
  const handleImageSelect = (image) => {
    setSelectedImage(image.url);
    setIsImageModalOpen(false);
  };

  // Generate with AI
  // ✅ استبدل handleGenerate بهذا
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

      console.log(data);
      

      if (data.success) {
        // الباك إند يرجع صورة واحدة الآن (HTML → PNG)
        setSelectedImage(data.imageUrl); // 👈 مباشرة بدون base64 prefix لأنها تأتي كاملة
        setAiGeneratedOptions({
          marketingContent: data.marketingContent, // للعرض إذا أردت
          image: data.image,
        });
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert('فشل توليد الصورة، حاول مرة أخرى');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!selectedProduct || !selectedImage || !domain) return;

    setIsPublishing(true);

    // Simulate publishing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Here you would typically send data to your backend
    const payload = {
      productId: selectedProduct.id,
      urlImage: selectedImage,
      domain: domain,
      paltform: platform,
    }

    console.log(payload);


    try {
      const response = await axios.post(`${baseURL}/landing-page`, payload, {
        headers: {
          Authorization: `bearer ${token}`
        }
      })

      console.log(response.data);


      if (response.data.success) {
        console.log(response.data.message);

      }
    } catch (error) {

    }

    setIsPublishing(false);

    // Show success message or redirect
    alert('Landing page published successfully!');
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-zinc-400" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Landing Page</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* 1. Creator Panel (العمود الأول) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Product Selection</h2>

            {/* Product Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Select Product
              </label>
              {selectedProduct ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h3>
                    <p className="text-sm text-purple-600 font-semibold">{formatPrice(selectedProduct.price)}</p>
                  </div>
                  <button onClick={() => setIsProductModalOpen(true)} className="p-2 text-gray-400 hover:text-purple-600 rounded-lg">
                    <ChevronDown size={20} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsProductModalOpen(true)} className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex items-center justify-between text-gray-500 hover:border-purple-500 transition-all">
                  <span>Select Product</span>
                  <ChevronDown size={20} />
                </button>
              )}
            </div>

            {/* AI Image Generator Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedProduct || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <><Loader2 size={20} className="animate-spin" /> Generating Style...</>
              ) : (
                <><Sparkles size={20} /> Generate with AI</>
              )}
            </button>

            {/* ✅ AI Generated Options - تظهر الآن داخل اللوحة بشكل منظم */}
            {/* ✅ استبدل aiGeneratedOptions block بهذا */}
            {aiGeneratedOptions && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-500/30 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <Wand2 size={16} /> تم توليد الصورة بنجاح ✅
                </h3>

                {/* عرض المحتوى التسويقي المولد */}
                {aiGeneratedOptions.marketingContent && (
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {aiGeneratedOptions.marketingContent.headline}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {aiGeneratedOptions.marketingContent.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiGeneratedOptions.marketingContent.features?.map((f, i) => (
                        <span
                          key={i}
                          className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full"
                        >
                          ✅ {f}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        🏷️ {aiGeneratedOptions.marketingContent.badge}
                      </span>
                      <span className="font-bold text-green-600">
                        {aiGeneratedOptions.marketingContent.price}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
              <span className="text-sm text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
            </div>

            {/* Media Library & Inputs */}
            <button onClick={() => setIsImageModalOpen(true)} className="w-full mb-6 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-zinc-300 hover:border-purple-500 transition-all">
              <ImageIcon size={20} /> Select from Media Library
            </button>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Domain Name</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Platform</label>
                <input type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Facebook / TikTok" className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white" />
              </div>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={!selectedProduct || !selectedImage || !domain || isPublishing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isPublishing ? <><Loader2 size={20} className="animate-spin" /> Publishing...</> : <><Check size={20} /> Publish Landing Page</>}
            </button>
          </div>

          {/* 2. Preview Panel (العمود الثاني) */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800 sticky top-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Live Preview</h2>
            <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center" style={{ aspectRatio: '9/16' }}>
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">Select or generate an image to see preview</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      {/* Product Selection Modal - أضف هذا الجزء هنا */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Product</h2>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
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
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-purple-600">{formatPrice(product.price)}</p>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No products found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* وأيضاً لا تنسى استدعاء الـ ModelImages هنا */}
      <ModelImages
        isOpen={isImageModalOpen}
        close={() => setIsImageModalOpen(false)}
        onSelectImage={handleImageSelect}
      />
    </div>
  );
};

export default CreateLandingPage;