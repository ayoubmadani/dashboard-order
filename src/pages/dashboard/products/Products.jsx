import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Search, Filter, ArrowUpDown, 
  MoreHorizontal, Edit2, Trash2, Eye,
  Package, Tag, DollarSign, Archive,
  ChevronDown, X, CheckCircle2, AlertCircle,
  Download, Upload, RefreshCw, Settings,
  ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight,
  Loader2, AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const API_BASE_URL = baseURL;

const Products = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState({ field: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null, productName: '' });
  const token = getAccessToken()
    
  // Get storeId from localStorage or context
  useEffect(() => {
    const storedStoreId = localStorage.getItem('storeId');
    if (storedStoreId) {
      setStoreId(storedStoreId);
    } else {
      toast.error('لم يتم العثور على معرف المتجر');
    }
  }, []);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== 'all' && { categoryId: selectedCategory }),
        ...(selectedStatus !== 'all' && { 
          isActive: selectedStatus === 'active' ? 'true' : 'false' 
        }),
      });

      const response = await axios.get(
        `${API_BASE_URL}/stores/${storeId}/products?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(response.data.products);
      

      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  }, [storeId, currentPage, itemsPerPage, searchQuery, selectedCategory, selectedStatus]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!storeId) return;

    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stores/${storeId}/categories`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
      fetchCategories();
    }
  }, [storeId, fetchProducts, fetchCategories]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (storeId) fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedStatus, currentPage, storeId, fetchProducts]);

  // Handle delete product
  const handleDelete = async () => {
    if (!deleteModal.productId) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/stores/${storeId}/products/${deleteModal.productId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      toast.success('تم حذف المنتج بنجاح');
      setDeleteModal({ isOpen: false, productId: null, productName: '' });
      fetchProducts();
      setSelectedProducts(prev => prev.filter(id => id !== deleteModal.productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('فشل في حذف المنتج');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedProducts.length} منتج؟`)) return;

    try {
      await Promise.all(
        selectedProducts.map(id => 
          axios.delete(
            `${API_BASE_URL}/stores/${storeId}/products/${id}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          )
        )
      );
      
      toast.success(`تم حذف ${selectedProducts.length} منتج بنجاح`);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      toast.error('فشل في حذف بعض المنتجات');
    }
  };

  // Toggle product status
  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/stores/${storeId}/products/${productId}/toggle-active`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      toast.success(currentStatus ? 'تم تعطيل المنتج' : 'تم تفعيل المنتج');
      fetchProducts();
    } catch (error) {
      toast.error('فشل في تغيير حالة المنتج');
    }
  };

  // Handle sort
  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Toggle product selection
  const toggleSelection = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle all selection
  const toggleAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  // Sort products locally
  const sortedProducts = [...products].sort((a, b) => {
    const aVal = a[sortBy.field];
    const bVal = b[sortBy.field];
    if (sortBy.direction === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  // Status badge component
  const StatusBadge = ({ status, isActive }) => {
    // Map backend status to frontend display
    const getStatusConfig = () => {
      if (!isActive) return {
        style: 'bg-gray-50 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-600',
        label: 'معطل'
      };
      if (status === 'out_of_stock' || status === 0) return {
        style: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
        label: 'نفذت الكمية'
      };
      if (typeof status === 'number' && status < 5) return {
        style: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
        label: 'كمية قليلة'
      };
      return {
        style: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
        label: 'نشط'
      };
    };

    const config = getStatusConfig();
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.style}`}>
        {config.label}
      </span>
    );
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-DZ');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">تأكيد الحذف</h3>
            </div>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">
              هل أنت متأكد من حذف المنتج <span className="font-semibold text-gray-900 dark:text-white">"{deleteModal.productName}"</span>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ isOpen: false, productId: null, productName: '' })}
                className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          
          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                <Package size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  المنتجات
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  إدارة مخزون المتجر
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchProducts}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                تحديث
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <Upload size={16} />
                استيراد
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <Download size={16} />
                تصدير
              </button>
              <Link  
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                to={'/dashboard/products/create'}
              >
                <Plus size={18} />
                منتج جديد
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث بالاسم، SKU، أو الوصف..."
                className="w-full pr-11 pl-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                  showFilters 
                    ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                    : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Filter size={16} />
                فلاتر
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {selectedProducts.length} محدد
                    <button 
                      onClick={() => setSelectedProducts([])}
                      className="mr-2 hover:text-indigo-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="حذف المحدد"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4 animate-in slide-in-from-top-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white outline-none"
              >
                <option value="all">جميع التصنيفات</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white outline-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">معطل</option>
              </select>

              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-sm font-medium transition-colors"
              >
                <X size={14} />
                مسح الفلاتر
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-500 dark:text-zinc-400">
            إجمالي: <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> منتج
            {isLoading && <span className="mr-2 text-indigo-600">(جاري التحميل...)</span>}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="max-w-[1400px] mx-auto py-6 px-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                  <th className="w-12 px-4 py-3.5">
                    <input 
                      type="checkbox"
                      checked={products.length > 0 && selectedProducts.length === products.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-white focus:ring-gray-900"
                    />
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      المنتج
                      <ArrowUpDown size={14} className={sortBy.field === 'name' ? 'text-gray-900 dark:text-white' : ''} />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort('sku')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      SKU
                      <ArrowUpDown size={14} className={sortBy.field === 'sku' ? 'text-gray-900 dark:text-white' : ''} />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                  >
                    التصنيف
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      السعر
                      <ArrowUpDown size={14} className={sortBy.field === 'price' ? 'text-gray-900 dark:text-white' : ''} />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      المخزون
                      <ArrowUpDown size={14} className={sortBy.field === 'stock' ? 'text-gray-900 dark:text-white' : ''} />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                  >
                    الحالة
                  </th>
                  <th 
                    className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200"
                  >
                    تاريخ الإضافة
                  </th>
                  <th className="w-20 px-4 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <Loader2 size={32} className="mx-auto text-gray-400 animate-spin mb-3" />
                      <p className="text-gray-500">جاري تحميل المنتجات...</p>
                    </td>
                  </tr>
                ) : sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        لا توجد منتجات
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        {searchQuery || selectedCategory !== 'all' ? 'جرب تغيير الفلاتر أو البحث' : 'ابدأ بإضافة منتج جديد'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        selectedProducts.includes(product.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                          className="rounded border-gray-300 dark:border-zinc-600 text-gray-900 focus:ring-gray-900"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border border-gray-200 dark:border-zinc-700">
                            <img 
                              src={product.productImage || product.imagesProduct?.[0]?.imageUrl || '/placeholder-product.png'} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/placeholder-product.png';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p 
                              className="font-medium text-gray-900 dark:text-white text-sm truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              onClick={() => navigate(`/dashboard/products/${product.id}`)}
                            >
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                              {product.desc || 'لا يوجد وصف'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                          {product.sku || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 dark:text-zinc-300">
                          {product.category?.name || 'غير مصنف'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">
                            {formatPrice(product.price)}
                          </span>
                          {product.priceOriginal && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(product.priceOriginal)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            product.stock === 0 ? 'bg-rose-500' :
                            product.stock < 5 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            product.stock === 0 ? 'text-rose-600 dark:text-rose-400' :
                            product.stock < 5 ? 'text-amber-600 dark:text-amber-400' :
                            'text-gray-700 dark:text-zinc-300'
                          }`}>
                            {product.stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.isActive)}
                          className="transition-opacity hover:opacity-80"
                        >
                          <StatusBadge status={product.stock} isActive={product.isActive} />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 dark:text-zinc-400">
                          {formatDate(product.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/dashboard/products/${product.slug || product.id}`}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="معاينة"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/dashboard/products/edit/${product.id}`}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button 
                            onClick={() => setDeleteModal({ 
                              isOpen: true, 
                              productId: product.id, 
                              productName: product.name 
                            })}
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <ChevronsRight size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <ArrowRight size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <ChevronsLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;