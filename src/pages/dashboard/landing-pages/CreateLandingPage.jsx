import React, { useState } from 'react';
import { 
  Sparkles, Image as ImageIcon, 
  X, Search, 
  Wand2, ArrowLeft, Check,
  Loader2, ChevronDown, Globe
} from 'lucide-react';
import ModelImages from '../../../components/ModelImages';

const CreateLandingPage = () => {
  // States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Mock products for selection
  const products = [
    { id: 1, name: 'Premium T-Shirt', price: 2500, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
    { id: 2, name: 'Classic Hoodie', price: 4500, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop' },
    { id: 3, name: 'Sport Jacket', price: 6500, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&h=200&fit=crop' },
    { id: 4, name: 'Casual Pants', price: 3200, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop' }
  ];

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
  const handleGenerate = async () => {
    if (!selectedProduct) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use product image or generate placeholder
    setSelectedImage(selectedProduct.image || '/api/placeholder/400/600');
    
    setIsGenerating(false);
  };

  // Handle publish
  const handlePublish = async () => {
    if (!selectedProduct || !selectedImage || !domain) return;
    
    setIsPublishing(true);
    
    // Simulate publishing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would typically send data to your backend
    console.log('Publishing:', {
      product: selectedProduct,
      image: selectedImage,
      domain: domain
    });
    
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Creator Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Product Selection</h2>
            
            {/* Product Selector - Custom Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Select Product
              </label>
              
              {selectedProduct ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h3>
                    <p className="text-sm text-purple-600 font-semibold">{formatPrice(selectedProduct.price)}</p>
                  </div>
                  <button 
                    onClick={() => setIsProductModalOpen(true)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsProductModalOpen(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex items-center justify-between text-gray-500 hover:border-purple-500 hover:text-purple-600 transition-all"
                >
                  <span>selecte product</span>
                  <ChevronDown size={20} />
                </button>
              )}
            </div>

            {/* AI Image Generator Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedProduct || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  generaiter by IA
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
              <span className="text-sm text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
            </div>

            {/* Select from ModelImages */}
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 py-3 border-2 border-gray-300 dark:border-zinc-700 rounded-xl text-gray-700 dark:text-zinc-300 hover:border-purple-500 hover:text-purple-600 transition-all"
            >
              <ImageIcon size={20} />
              Select from Media Library
            </button>

            {/* Domain Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Domain Name
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                />
              </div>
            </div>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={!selectedProduct || !selectedImage || !domain || isPublishing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Publish Landing Page
                </>
              )}
            </button>
          </div>

          {/* Preview Panel - Image Only */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Preview</h2>
            
            <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: '1/1.5' }}>
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt="Product Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-2xl font-light">image</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
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
                {filteredProducts.map(product => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Selection Modal */}
      <ModelImages 
        isOpen={isImageModalOpen} 
        close={() => setIsImageModalOpen(false)} 
        onSelectImage={handleImageSelect}
      />

    </div>
  );
};

export default CreateLandingPage;