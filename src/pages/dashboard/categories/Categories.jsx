import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Edit3, Trash2, X, Search, Tag, Image as ImageIcon,
  ChevronRight, FolderTree, RefreshCw, Package, LayoutGrid, List, Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ModelImages from '../../../components/ModelImages';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import Loading from '../../../components/Loading';
import NoStoreState from '../../../components/NoStoreState';

/* ── API setup ── */
const getStoreId = () => localStorage.getItem('storeId');

const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Content-Type'] = 'application/json';
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err.response?.data?.message || err.message || 'An error occurred'))
);

const fetchCategories = (storeId) => apiClient.get(`/stores/${storeId}/categories`).then(r => r.data);
const fetchNiches = (storeId) => apiClient.get(`/niches/category-niche/${storeId}`).then(r => r.data);
const createCategory = ({ storeId, data }) => apiClient.post(`/stores/${storeId}/categories`, data).then(r => r.data);
const updateCategory = ({ storeId, categoryId, data }) => apiClient.patch(`/stores/${storeId}/categories/${categoryId}`, data).then(r => r.data);
const deleteCategory = ({ storeId, categoryId }) => apiClient.delete(`/stores/${storeId}/categories/${categoryId}`).then(r => r.data);
const searchCategories = (storeId, searchTerm) => apiClient.get(`/stores/${storeId}/categories/search`, { params: { q: searchTerm } }).then(r => r.data);

/* ── Field wrapper ── */
const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-4 py-2.5 border ${err ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'} bg-gray-50 dark:bg-zinc-950 rounded-xl text-sm outline-none transition-all dark:text-white`;

/* ════════════════════════════════════════════════════════════ */
const Categories = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'categories' });
  const isRtl = i18n.dir() === 'rtl';
  const queryClient = useQueryClient();
  const storeId = getStoreId();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewMode, setViewMode] = useState('tree');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { type: 'single', category } | { type: 'bulk' }

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', imageUrl: '',
    parentId: null, sortOrder: 0, isActive: true, categoryNicheId: null,
  });
  const [errors, setErrors] = useState({});

  /* ── Queries ── */
  const { data: categories = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: () => fetchCategories(storeId),
    enabled: !!storeId,
  });

  const { data: niches = [] } = useQuery({

    queryKey: ['niches', storeId],
    queryFn: () => fetchNiches(storeId),
    enabled: !!storeId,
  });

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      toast.success(t('toast.create_success'));
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      toast.success(t('toast.update_success'));
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
      toast.success(data.message || t('delete.success'));
    },
    onError: (err) => toast.error(err.message),
  });

  const searchMutation = useMutation({
    mutationFn: ({ storeId, searchTerm }) => searchCategories(storeId, searchTerm),
    onSuccess: (data) => queryClient.setQueryData(['categories', storeId], data),
    onError: (err) => toast.error(err.message),
  });

  /* ── Helpers ── */
  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', imageUrl: '', parentId: null, sortOrder: 0, isActive: true, categoryNicheId: null });
    setErrors({});
    setEditingCategory(null);
  };

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' && !editingCategory ? { slug: generateSlug(value) } : {}),
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageSelect = (image) => {
    setFormData(prev => ({ ...prev, imageUrl: image.url }));
    setIsImageModalOpen(false);
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim()) e.name = t('validation.name_required');
    if (editingCategory && formData.parentId === editingCategory.id)
      e.parentId = t('validation.parent_self');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const openAddModal = () => { resetForm(); setIsModalOpen(true); };
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      parentId: category.parentId || null,           // ✅ بدل category.parent?.id
      sortOrder: +category.sortOrder || 0,
      isActive: category.isActive ?? true,
      categoryNicheId: category.categoryNicheId || null,  // ✅ بدل category.categoryNiche?.id
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // ── select الـ parent: أضف indentation لإظهار المستوى ==
  const getAvailableParentsWithLevel = () => {
    const result = [];
    const traverse = (cats, level = 0) => {
      cats.forEach(cat => {
        if (editingCategory && cat.id === editingCategory.id) return;
        result.push({ ...cat, level });
        if (cat.children?.length > 0) traverse(cat.children, level + 1);
      });
    };
    traverse(editingCategory
      ? categories  // الشجرة بالكامل
      : categories
    );
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = {
      ...formData,
      parentId: formData.parentId || undefined,
      categoryNicheId: formData.categoryNicheId || undefined,
    };


    if (editingCategory) {
      updateMutation.mutate({ storeId, categoryId: editingCategory.id, data: payload });
    } else {
      createMutation.mutate({ storeId, data: payload });
    }
  };

  const handleDelete = (category) => setPendingDelete({ type: 'single', category });

  const getSingleDeleteMessage = (category) => {
    const hasChildren = category.children?.length > 0;
    const hasProducts = category.products?.length > 0;
    let msg = t('delete.confirm', { name: category.name });
    if (hasChildren || hasProducts) {
      msg += t('delete.warning_header');
      if (hasChildren) msg += t('delete.has_children', { count: category.children.length });
      if (hasProducts) msg += t('delete.has_products', { count: category.products.length });
    }
    return msg;
  };

  const toggleCategorySelection = (id) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── flatten الشجرة لجلب كل التصنيفات ==
  const flattenCategories = (cats, result = []) => {
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children?.length > 0) flattenCategories(cat.children, result);
    });
    return result;
  };

  const allCategoryIds = flattenCategories(categories).map(c => c.id);
  const allSelected = allCategoryIds.length > 0 && allCategoryIds.every(id => selectedCategories.has(id));

  const toggleSelectAllCategories = () => {
    setSelectedCategories(allSelected ? new Set() : new Set(allCategoryIds));
  };

  const clearSelection = () => setSelectedCategories(new Set());

  const handleBulkDelete = () => {
    if (!selectedCategories.size) return;
    setPendingDelete({ type: 'bulk' });
  };

  const runBulkDelete = async () => {
    const ids = Array.from(selectedCategories);
    if (!ids.length) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map(id => deleteCategory({ storeId, categoryId: id }))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = ids.length - failed;

      if (failed === 0) {
        toast.success(t('bulk_delete.success', { count: succeeded }));
      } else if (succeeded === 0) {
        toast.error(t('bulk_delete.all_failed'));
      } else {
        toast.warning(t('bulk_delete.partial', { succeeded, failed }));
      }

      setSelectedCategories(new Set());
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] });
    } finally {
      setIsBulkDeleting(false);
      setPendingDelete(null);
    }
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'single') {
      deleteMutation.mutate(
        { storeId, categoryId: pendingDelete.category.id },
        { onSettled: () => setPendingDelete(null) },
      );
    } else if (pendingDelete.type === 'bulk') {
      runBulkDelete();
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

  const toggleExpand = (id) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };


  // ── getAvailableParents: flat list بدون الـ category الحالي وأبنائه ==
  const getAvailableParents = () => {
    const flat = flattenCategories(categories);
    if (!editingCategory) return flat;

    // استثناء الـ category نفسه وكل أبنائه لمنع الحلقة
    const getDescendantIds = (cat) => {
      const ids = new Set([cat.id]);
      (cat.children || []).forEach(child => {
        getDescendantIds(child).forEach(id => ids.add(id));
      });
      return ids;
    };

    const editingNode = flat.find(c => c.id === editingCategory.id);
    const excludedIds = editingNode ? getDescendantIds(editingNode) : new Set([editingCategory.id]);

    return flat.filter(c => !excludedIds.has(c.id));
  };


  const getNicheName = (niche) => {
    if (!niche) return '';
    if (i18n.language === 'ar') return niche.name_ar;
    if (i18n.language === 'fr') return niche.name_fr;
    return niche.name_en;
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /* ── Tree Node ── */
  const TreeNode = ({ category, level = 0 }) => {
    const hasChildren = category.children?.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategories.has(category.id);

    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''} ${level > 0 ? `${isRtl ? 'mr-4 border-r-2' : 'ml-4 border-l-2'} border-gray-200 dark:border-zinc-800` : ''}`}
          style={level > 0 ? { [isRtl ? 'marginRight' : 'marginLeft']: `${level * 16}px` } : {}}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleCategorySelection(category.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
          />

          <button
            onClick={() => hasChildren && toggleExpand(category.id)}
            className={`p-1 rounded-lg transition-all ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-zinc-700' : 'invisible'}`}
          >
            <ChevronRight
              size={16}
              className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isRtl ? 'rotate-180' : ''} ${isExpanded && isRtl ? '!rotate-90' : ''}`}
            />
          </button>

          <div className="flex-1 flex items-center gap-3 group min-w-0">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-zinc-800" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <FolderTree size={16} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{category.name}</h4>
              <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono truncate">{category.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
                <Package size={13} />
                {category.products?.length || 0}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(category)}
                  className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
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

  /* ── No store selected ── */
  if (!storeId) {
    return <NoStoreState title={t('no_store.title')} subtitle={t('no_store.subtitle')} cta={t('no_store.cta')} isRtl={isRtl} />;
  }

  /* ── Loading ── */
  if (isLoading) return <Loading />;

  /* ── Error ── */
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={28} className="text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-rose-600 mb-2">{t('error.title')}</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            {t('error.retry')}
          </button>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Delete confirm modal (single + bulk) ── */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Trash2 size={26} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              {pendingDelete.type === 'single' ? t('delete.title') : t('bulk_delete.title')}
            </h3>
            <p className="text-sm text-center text-gray-500 dark:text-zinc-400 whitespace-pre-line mb-2">
              {pendingDelete.type === 'single'
                ? getSingleDeleteMessage(pendingDelete.category)
                : t('bulk_delete.confirm', { count: selectedCategories.size })}
            </p>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleteMutation.isPending || isBulkDeleting}
                className="flex-1 px-4 py-2.5 text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
              >
                {t('delete.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmPendingDelete}
                disabled={deleteMutation.isPending || isBulkDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25 disabled:opacity-60"
              >
                {(deleteMutation.isPending || isBulkDeleting) && <Loader2 size={16} className="animate-spin" />}
                {t('delete.confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-6">

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                <Tag size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">


              {/* New button */}
              <button
                onClick={openAddModal}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                <Plus size={18} />
                {createMutation.isPending ? t('header.creating') : t('header.new_btn')}
              </button>
            </div>
          </div>

          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`}
                size={17}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder={t('search.placeholder')}
                className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white transition-all ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
              />
              {searchMutation.isPending && (
                <RefreshCw
                  size={14}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 animate-spin ${isRtl ? 'left-3.5' : 'right-3.5'}`}
                />
              )}
            </div>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); refetch(); }}
                className="px-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all font-medium">
                {t('search.clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Bulk actions bar */}
        {categories.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAllCategories}
                className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              {t('bulk_delete.select_all')}
            </label>

            {selectedCategories.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium">
                  {t('bulk_delete.selected_count', { count: selectedCategories.size })}
                  <button onClick={clearSelection} className="hover:text-indigo-800 dark:hover:text-indigo-300">
                    <X size={13} />
                  </button>
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                >
                  {isBulkDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isBulkDeleting ? t('bulk_delete.deleting') : t('bulk_delete.delete_selected')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tree View */}
        {viewMode === 'tree' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-500">
                {t('tree.empty')}
              </div>
            ) : (
              <div className="p-3 space-y-0.5">
                {categories.map(category => (
                  <TreeNode key={category.id} category={category} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global empty state */}
        {categories.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">{t('empty.subtitle')}</p>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
              {t('empty.add_btn')}
            </button>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-zinc-800"
            dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingCategory ? t('modal.title_edit') : t('modal.title_create')}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Image */}
              <Field label={t('modal.image_label')}>
                <div onClick={() => setIsImageModalOpen(true)} className="relative cursor-pointer group">
                  {formData.imageUrl ? (
                    <div className="relative h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700">
                      <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                          {t('modal.image_change')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-all bg-gray-50 dark:bg-zinc-800/50">
                      <ImageIcon size={28} />
                      <span className="text-sm font-medium">{t('modal.image_placeholder')}</span>
                    </div>
                  )}
                </div>
              </Field>

              {/* Parent */}
              <Field label={t('modal.parent_label')} error={errors.parentId}>
                <select
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || null }))}
                  className={`${inputCls(errors.parentId)} cursor-pointer`}>
                  <option value="">{t('modal.parent_none')}</option>
                  {getAvailableParentsWithLevel().map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {'　'.repeat(cat.level)}{cat.level > 0 ? '└ ' : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Category Niche — hidden for now, revisit later */}
              {/* <Field label={t('modal.category_niche')} error={errors.categoryNicheId}>
                <select
                  name="categoryNicheId"
                  value={formData.categoryNicheId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryNicheId: e.target.value || null }))}
                  className={`${inputCls(errors.categoryNicheId)} cursor-pointer`}>
                  <option value="">{t('modal.niche_none')}</option>
                  {niches.map(niche => (
                    <option key={niche.id} value={niche.id}>
                      {getNicheName(niche)}
                    </option>
                  ))}
                </select>
              </Field> */}

              {/* Name */}
              <Field label={t('modal.name_label')} error={errors.name}>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleChange}
                  placeholder={t('modal.name_placeholder')}
                  className={inputCls(errors.name)} />
              </Field>

              {/* Status */}
              <Field label={t('modal.status_label')}>
                <div className="flex items-center gap-2.5 h-[42px]">
                  <input
                    type="checkbox" name="isActive" id="isActive"
                    checked={formData.isActive} onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="isActive" className="text-sm text-gray-600 dark:text-zinc-400 cursor-pointer select-none">
                    {t('modal.status_active')}
                  </label>
                </div>
              </Field>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  {t('modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <RefreshCw size={15} className="animate-spin" />}
                  {isSaving
                    ? t('modal.saving')
                    : editingCategory ? t('modal.update_btn') : t('modal.create_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Image Picker ── */}
      <ModelImages
        isOpen={isImageModalOpen}
        close={() => setIsImageModalOpen(false)}
        onSelectImage={handleImageSelect}
        initialFolder='category'
      />
    </div>
  );
};

export default Categories;