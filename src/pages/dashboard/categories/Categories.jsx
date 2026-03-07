import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Edit3, Trash2, X, Search, Tag, Image as ImageIcon,
  ChevronRight, FolderTree, RefreshCw, Package, LayoutGrid, List
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ModelImages from '../../../components/ModelImages';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';

/* ── API setup ── */
const getStoreId = () => {
  const storeId = localStorage.getItem('storeId');
  if (!storeId) throw new Error('Store ID not found.');
  return storeId;
};

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

const fetchCategories    = (storeId)                  => apiClient.get(`/stores/${storeId}/categories`).then(r => r.data);
const createCategory     = ({ storeId, data })        => apiClient.post(`/stores/${storeId}/categories`, data).then(r => r.data);
const updateCategory     = ({ storeId, categoryId, data }) => apiClient.patch(`/stores/${storeId}/categories/${categoryId}`, data).then(r => r.data);
const deleteCategory     = ({ storeId, categoryId }) => apiClient.delete(`/stores/${storeId}/categories/${categoryId}`).then(r => r.data);
const searchCategories   = (storeId, searchTerm)      => apiClient.get(`/stores/${storeId}/categories/search`, { params: { q: searchTerm } }).then(r => r.data);

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
const { t , i18n} = useTranslation('translation', { keyPrefix: 'categories' });  
  const isRtl = i18n.dir() === 'rtl';
  const queryClient = useQueryClient();
  const storeId = getStoreId();

  const [searchQuery, setSearchQuery]         = useState('');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewMode, setViewMode]               = useState('grid');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', imageUrl: '',
    parentId: null, sortOrder: 0, isActive: true,
  });
  const [errors, setErrors] = useState({});

  /* ── Queries ── */
  const { data: categories = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories', storeId],
    queryFn: () => fetchCategories(storeId),
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
    setFormData({ name: '', slug: '', description: '', imageUrl: '', parentId: null, sortOrder: 0, isActive: true });
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
    if (!formData.name.trim())  e.name = t('validation.name_required');
    if (!formData.slug.trim())  e.slug = t('validation.slug_required');
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
    const payload = { ...formData, parentId: formData.parentId || undefined };
    if (editingCategory) {
      updateMutation.mutate({ storeId, categoryId: editingCategory.id, data: payload });
    } else {
      createMutation.mutate({ storeId, data: payload });
    }
  };

  const handleDelete = (category) => {
    const hasChildren = category.children?.length > 0;
    const hasProducts = category.products?.length > 0;
    let msg = t('delete.confirm', { name: category.name });
    if (hasChildren || hasProducts) {
      msg += t('delete.warning_header');
      if (hasChildren) msg += t('delete.has_children', { count: category.children.length });
      if (hasProducts) msg += t('delete.has_products', { count: category.products.length });
      msg += t('delete.warning_footer');
    }
    if (window.confirm(msg)) deleteMutation.mutate({ storeId, categoryId: category.id });
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

  const getAvailableParents = () =>
    editingCategory ? categories.filter(c => c.id !== editingCategory.id) : categories;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /* ── Tree Node ── */
  const TreeNode = ({ category, level = 0 }) => {
    const hasChildren = category.children?.length > 0;
    const isExpanded  = expandedCategories.has(category.id);

    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors ${level > 0 ? `${isRtl ? 'mr-4 border-r-2' : 'ml-4 border-l-2'} border-gray-200 dark:border-zinc-800` : ''}`}
          style={level > 0 ? { [isRtl ? 'marginRight' : 'marginLeft']: `${level * 16}px` } : {}}
        >
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

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <RefreshCw size={28} className="animate-spin text-indigo-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

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
              {/* View toggle */}
              <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 gap-0.5">
                {[
                  { mode: 'grid', icon: <LayoutGrid size={15} />, label: t('header.view_grid') },
                  { mode: 'tree', icon: <List size={15} />,        label: t('header.view_tree') },
                ].map(v => (
                  <button key={v.mode} onClick={() => setViewMode(v.mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === v.mode ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}>
                    {v.icon}{v.label}
                  </button>
                ))}
              </div>

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

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div key={cat.id}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-700 transition-all">

                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Action buttons */}
                  <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm">
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deleteMutation.isPending && deleteMutation.variables?.categoryId === cat.id}
                      className="p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50 shadow-sm">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Status badge */}
                  {!cat.isActive && (
                    <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`}>
                      <span className="px-2 py-0.5 bg-gray-900/70 text-gray-300 text-[10px] font-bold rounded-full backdrop-blur-sm">
                        غير نشط
                      </span>
                    </div>
                  )}

                  {/* Name overlay */}
                  <div className={`absolute bottom-3 ${isRtl ? 'right-3 left-3' : 'left-3 right-3'}`}>
                    <h3 className="font-bold text-white text-base drop-shadow-md">{cat.name}</h3>
                    <p className="text-white/70 text-[11px] font-mono">{cat.slug}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Tag size={13} className="text-gray-500 dark:text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider">{t('grid.products_label')}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{cat.products?.length || 0}</p>
                      </div>
                    </div>
                    {cat.children?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                          <FolderTree size={13} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider">{t('grid.sub_label')}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{cat.children.length}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="text-xs font-medium text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {t('grid.view_products')}
                  </button>
                </div>
              </div>
            ))}

            {/* Add card */}
            <button
              onClick={openAddModal}
              className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400 transition-all min-h-[260px]">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                <Plus size={22} />
              </div>
              <span className="text-sm font-semibold">{t('grid.add_new')}</span>
            </button>
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
                  {getAvailableParents().map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </Field>

              {/* Name */}
              <Field label={t('modal.name_label')} error={errors.name}>
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleChange}
                  placeholder={t('modal.name_placeholder')}
                  className={inputCls(errors.name)} />
              </Field>

              {/* Slug */}
              <Field label={t('modal.slug_label')} error={errors.slug}>
                <input
                  type="text" name="slug" value={formData.slug} dir="ltr"
                  onChange={handleChange}
                  placeholder={t('modal.slug_placeholder')}
                  className={`${inputCls(errors.slug)} font-mono text-xs`} />
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">{t('modal.slug_hint')}</p>
              </Field>

              {/* Description */}
              <Field label={t('modal.description_label')}>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleChange} rows={3}
                  placeholder={t('modal.description_placeholder')}
                  className={`${inputCls()} resize-none`} />
              </Field>

              {/* Sort + Status */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('modal.sort_label')}>
                  <input type="number" name="sortOrder" value={formData.sortOrder}
                    onChange={handleChange} min="0"
                    className={inputCls()} />
                </Field>
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
              </div>

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
      />
    </div>
  );
};

export default Categories;