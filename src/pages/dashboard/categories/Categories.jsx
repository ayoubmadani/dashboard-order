import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Edit3, Trash2, X, Search, Tag, Image as ImageIcon, 
  ChevronRight, FolderTree, RefreshCw, Package
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ModelImages from '../../../components/ModelImages';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';

// Helper to get storeId from localStorage
const getStoreId = () => {
  const storeId = localStorage.getItem('storeId');
  if (!storeId) {
    throw new Error('Store ID not found. Please select a store first.');
  }
  return storeId;
};

// Axios instance with default config
const apiClient = axios.create({
  baseURL: baseURL,
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Content-Type'] = 'application/json';
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// API Functions (All using Axios)
const fetchCategories = async (storeId) => {
  const response = await apiClient.get(`/stores/${storeId}/categories`);
  return response.data;
};

const fetchCategoryStats = async (storeId, categoryId) => {
  const response = await apiClient.get(`/stores/${storeId}/categories/${categoryId}/stats`);
  return response.data;
};

const createCategory = async ({ storeId, data }) => {
  const response = await apiClient.post(`/stores/${storeId}/categories`, data);
  return response.data;
};

const updateCategory = async ({ storeId, categoryId, data }) => {
  const response = await apiClient.patch(`/stores/${storeId}/categories/${categoryId}`, data);
  return response.data;
};

const deleteCategory = async ({ storeId, categoryId }) => {
  const response = await apiClient.delete(`/stores/${storeId}/categories/${categoryId}`);
  return response.data;
};

const searchCategories = async (storeId, searchTerm) => {
  const response = await apiClient.get(`/stores/${storeId}/categories/search`, {
    params: { q: searchTerm }
  });
  return response.data;
};

const moveProducts = async ({ storeId, fromId, toId }) => {
  const response = await apiClient.post(
    `/stores/${storeId}/categories/${fromId}/move-products/${toId}`
  );
  return response.data;
};

const Categories = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const storeId = getStoreId();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'tree'
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: null,
    sortOrder: 0,
    isActive: true,
  });
  
  const [errors, setErrors] = useState({});

  // React Query Hooks
  const { 
    data: categories = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: () => fetchCategories(storeId),
    enabled: !!storeId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      toast.success('تم إنشاء التصنيف بنجاح');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      toast.success('تم تحديث التصنيف بنجاح');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      toast.success(data.message || 'تم حذف التصنيف بنجاح');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const searchMutation = useMutation({
    mutationFn: ({ storeId, searchTerm }) => searchCategories(storeId, searchTerm),
    onSuccess: (data) => {
      queryClient.setQueryData(['categories', storeId], data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Helpers
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      parentId: null,
      sortOrder: 0,
      isActive: true,
    });
    setErrors({});
    setEditingCategory(null);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' && !editingCategory ? { slug: generateSlug(value) } : {})
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (image) => {
    setFormData(prev => ({ ...prev, imageUrl: image.url }));
    setIsImageModalOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'اسم التصنيف مطلوب';
    if (!formData.slug.trim()) newErrors.slug = 'المعرف مطلوب';
    
    if (editingCategory && formData.parentId === editingCategory.id) {
      newErrors.parentId = 'لا يمكن جعل التصنيف أباً لنفسه';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parent?.id || null,
      sortOrder: +category.sortOrder || 0,
      isActive: category.isActive ?? true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      parentId: formData.parentId || undefined,
    };

    if (editingCategory) {
      updateMutation.mutate({ 
        storeId, 
        categoryId: editingCategory.id, 
        data: payload 
      });
    } else {
      createMutation.mutate({ storeId, data: payload });
    }
  };

  const handleDelete = (category) => {
    const hasChildren = category.children?.length > 0;
    const hasProducts = category.products?.length > 0;
    
    let confirmMessage = `هل أنت متأكد من حذف "${category.name}"؟`;
    if (hasChildren || hasProducts) {
      confirmMessage += '\n\nتحذير:';
      if (hasChildren) confirmMessage += `\n- يحتوي على ${category.children.length} تصنيفات فرعية`;
      if (hasProducts) confirmMessage += `\n- يحتوي على ${category.products.length} منتجات`;
      confirmMessage += '\n\nسيفشل الحذف إذا كانت البيانات مرتبطة!';
    }

    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate({ storeId, categoryId: category.id });
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      searchMutation.mutate({ storeId, searchTerm: value });
    } else {
      refetch();
    }
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getAvailableParents = () => {
    if (!editingCategory) return categories;
    return categories.filter(cat => cat.id !== editingCategory.id);
  };

  // Recursive component for tree view
  const TreeNode = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div className="select-none">
        <div 
          className={`flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors ${level > 0 ? 'mr-4 border-r-2 border-gray-200 dark:border-zinc-800' : ''}`}
          style={{ marginRight: `${level * 16}px` }}
        >
          <button
            onClick={() => hasChildren && toggleExpand(category.id)}
            className={`p-1 rounded transition-transform ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-zinc-700' : 'invisible'}`}
          >
            <ChevronRight 
              size={16} 
              className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </button>
          
          <div className="flex-1 flex items-center gap-3 group">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                <FolderTree size={16} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono">{category.slug}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Package size={14} />
                {category.products?.length || 0}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(category)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-600 dark:text-zinc-400"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(category)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children.map(child => (
              <TreeNode key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={32} className="animate-spin text-gray-400" />
          <p className="text-gray-500 dark:text-zinc-400">جاري تحميل التصنيفات...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/30">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">التصنيفات</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                إدارة تصنيفات المنتجات الهرمية
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}
                >
                  شبكة
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tree' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}
                >
                  شجري
                </button>
              </div>
              <button 
                onClick={openAddModal}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Plus size={18} />
                {createMutation.isPending ? 'جاري الإنشاء...' : 'تصنيف جديد'}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="البحث في التصنيفات..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white"
              />
            </div>
            {(searchQuery || searchMutation.isPending) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  refetch();
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className="group bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative h-40 overflow-hidden">
                  {cat.imageUrl ? (
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(cat)}
                      className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg text-gray-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat)}
                      disabled={deleteMutation.isPending && deleteMutation.variables?.categoryId === cat.id}
                      className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-white text-lg drop-shadow-md">{cat.name}</h3>
                    <p className="text-white/80 text-xs font-mono">{cat.slug}</p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Tag size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">المنتجات</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{cat.products?.length || 0}</p>
                      </div>
                    </div>
                    {cat.children?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <FolderTree size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">فرعية</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{cat.children.length}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                    عرض المنتجات →
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={openAddModal}
              className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-400 hover:text-gray-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300 transition-all min-h-[280px]"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center">
                <Plus size={24} />
              </div>
              <span className="text-sm font-medium">إضافة تصنيف جديد</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-zinc-400">لا توجد تصنيفات</div>
            ) : (
              categories.map(category => <TreeNode key={category.id} category={category} />)
            )}
          </div>
        )}

        {categories.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد تصنيفات</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">ابدأ بإضافة أول تصنيف لمتجرك</p>
            <button 
              onClick={openAddModal}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:opacity-90"
            >
              إضافة تصنيف
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">صورة التصنيف</label>
                <div 
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative cursor-pointer group"
                >
                  {formData.imageUrl ? (
                    <div className="relative h-40 rounded-lg overflow-hidden">
                      <img src={formData.imageUrl} alt="Category" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">تغيير الصورة</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:border-gray-400 transition-colors">
                      <ImageIcon size={32} />
                      <span className="text-sm">اختر صورة من المكتبة</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">التصنيف الأب (اختياري)</label>
                <select
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || null }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white dark:bg-zinc-800"
                >
                  <option value="">بدون تصنيف أب (تصنيف رئيسي)</option>
                  {getAvailableParents().map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.parentId && <p className="text-xs text-red-500">{errors.parentId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">الاسم *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: إلكترونيات"
                  className={`w-full px-4 py-2.5 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white dark:bg-zinc-800`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">المعرف (Slug) *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="electronics"
                  className={`w-full px-4 py-2.5 border ${errors.slug ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'} rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm font-mono dark:text-white dark:bg-zinc-800`}
                />
                {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
                <p className="text-xs text-gray-400">يستخدم للروابط والبحث، مثل: /category/electronics</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">الوصف</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="وصف مختصر للتصنيف..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white dark:bg-zinc-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">الترتيب</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white dark:bg-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">الحالة</label>
                  <div className="flex items-center gap-2 h-[42px]">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400">نشط</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw size={16} className="animate-spin" />}
                  {editingCategory ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
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

export default Categories;