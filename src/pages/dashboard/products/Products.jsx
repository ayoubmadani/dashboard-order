import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Filter, ArrowUpDown,
  Edit2, Trash2, Eye, Package,
  ChevronDown, X, CheckCircle2,
  Download, Upload, RefreshCw,
  ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight,
  Loader2, AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const Products = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'products' });
  const navigate = useNavigate();
  const token = getAccessToken();
  const isRtl = i18n.dir() === 'rtl';

  const [confirmName, setConfirmName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState({ field: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null, productName: '' });

  useEffect(() => {
    const storedStoreId = localStorage.getItem('storeId');
    if (storedStoreId) setStoreId(storedStoreId);
    else toast.error(t('list.toast.store_not_found'));
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== 'all' && { categoryId: selectedCategory }),
        ...(selectedStatus !== 'all' && { isActive: selectedStatus === 'active' ? 'true' : 'false' }),
      });
      const response = await axios.get(
        `${baseURL}/stores/${storeId}/products?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(response.data);
      
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('list.toast.load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [storeId, currentPage, itemsPerPage, searchQuery, selectedCategory, selectedStatus]);

  const fetchCategories = useCallback(async () => {
    if (!storeId) return;
    try {
      const response = await axios.get(
        `${baseURL}/stores/${storeId}/categories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) { fetchProducts(); fetchCategories(); }
  }, [storeId, fetchProducts, fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => { if (storeId) fetchProducts(); }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedStatus, currentPage, storeId, fetchProducts]);

  const handleDelete = async () => {
    if (!deleteModal.productId) return;
    try {
      await axios.delete(
        `${baseURL}/stores/${storeId}/products/${deleteModal.productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t('list.toast.delete_success'));
      setDeleteModal({ isOpen: false, productId: null, productName: '' });
      setConfirmName('');
      fetchProducts();
      setSelectedProducts(prev => prev.filter(id => id !== deleteModal.productId));
    } catch (error) {
      toast.error(t('list.toast.delete_failed'));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;
    if (!window.confirm(t('list.toast.bulk_confirm', { count: selectedProducts.length }))) return;
    try {
      await Promise.all(
        selectedProducts.map(id =>
          axios.delete(`${baseURL}/stores/${storeId}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        )
      );
      toast.success(t('list.toast.bulk_success', { count: selectedProducts.length }));
      setSelectedProducts([]);
      fetchProducts();
    } catch {
      toast.error(t('list.toast.bulk_partial_fail'));
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await axios.patch(
        `${baseURL}/stores/${storeId}/products/${productId}/toggle-active`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(currentStatus ? t('list.toast.status_disabled') : t('list.toast.status_enabled'));
      fetchProducts();
    } catch {
      toast.error(t('list.toast.status_failed'));
    }
  };

  const handleSort = (field) =>
    setSortBy(prev => ({ field, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const toggleSelection = (id) =>
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));

  const sortedProducts = [...products].sort((a, b) => {
    const aVal = a[sortBy.field], bVal = b[sortBy.field];
    return sortBy.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const getStatusConfig = (status, isActive) => {
    if (!isActive) return { style: 'bg-gray-50 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-600', label: t('list.status_badge.disabled') };
    return { style: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', label: t('list.status_badge.active') };
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat(isRtl ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(price);

  const formatDate = (d) => new Date(d).toLocaleDateString(isRtl ? 'ar-DZ' : 'fr-DZ');

  const requiredText = (() => {
    const words = deleteModal.productName.trim().split(/\s+/);
    return (words.length > 1 ? `${words[0]} ${words[1]}` : words[0] || '').substring(0, 15);
  })();

  const tableColumns = [
    { key: 'name', label: t('list.table.product'), sortable: true },
    { key: 'show', label: t('list.table.show'), sortable: true },
    { key: 'category', label: t('list.table.category'), sortable: false },
    { key: 'price', label: t('list.table.price'), sortable: true },
    { key: 'stock', label: t('list.table.stock'), sortable: true },
    { key: 'status', label: t('list.table.status'), sortable: false },
    { key: 'createdAt', label: t('list.table.date'), sortable: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950" dir={isRtl ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />

      {/* ── Delete Modal ── */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-rose-100 dark:border-rose-900/20">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={28} className="animate-pulse shrink-0" />
              <h3 className="text-xl font-bold">{t('list.delete_modal.title')}</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                {t('list.delete_modal.about_to_delete')}{' '}
                <span className="font-bold text-gray-900 dark:text-white">"{deleteModal.productName}"</span>.
                <br />
                <span className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 px-2 py-1 rounded mt-2 inline-block">
                  {t('list.delete_modal.warning')}
                </span>
              </p>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                  {t('list.delete_modal.type_to_confirm')}
                  <div className="mt-2 p-2 bg-white dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-zinc-700 rounded text-center font-mono font-bold text-rose-600 select-all">
                    {requiredText}
                  </div>
                </label>
                <input
                  type="text"
                  placeholder={t('list.delete_modal.type_placeholder')}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-rose-500 dark:bg-zinc-800 dark:text-white transition-all font-semibold text-center"
                  onChange={(e) => setConfirmName(e.target.value)}
                  value={confirmName}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setDeleteModal({ isOpen: false, productId: null, productName: '' }); setConfirmName(''); }}
                className="flex-1 px-4 py-2.5 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors font-medium"
              >
                {t('list.delete_modal.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmName !== requiredText}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white transition-all ${confirmName === requiredText ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/30' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'}`}
              >
                {t('list.delete_modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                <Package size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('list.title')}</h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('list.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={fetchProducts} disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                {t('list.refresh')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <Upload size={16} />{t('list.import')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 border border-gray-300 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                <Download size={16} />{t('list.export')}
              </button>
              <Link
                to="/dashboard/products/create"
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />{t('list.new_product')}
              </Link>
            </div>
          </div>

          {/* Search + Filter bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('list.search_placeholder')}
                className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none text-sm dark:text-white ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
              >
                <Filter size={16} />
                {t('list.filters')}
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {t('list.selected', { count: selectedProducts.length })}
                    <button onClick={() => setSelectedProducts([])} className={isRtl ? 'mr-1' : 'ml-1'}>
                      <X size={14} />
                    </button>
                  </div>
                  <button onClick={handleBulkDelete}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                    title={t('list.bulk_delete_selected')}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white outline-none">
                <option value="all">{t('list.all_categories')}</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm dark:text-white outline-none">
                <option value="all">{t('list.all_statuses')}</option>
                <option value="active">{t('list.status_active')}</option>
                <option value="inactive">{t('list.status_inactive')}</option>
              </select>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setSearchQuery(''); setCurrentPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-colors">
                <X size={14} />{t('list.clear_filters')}
              </button>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500 dark:text-zinc-400">
            {t('list.total', { count: totalItems })}
            {isLoading && <span className={`${isRtl ? 'mr-2' : 'ml-2'} text-indigo-600`}>{t('list.loading_inline')}</span>}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="h-full py-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">

                  {tableColumns.map(col => (
                    <th key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'} ${col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200' : ''}`}>
                      <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                        {col.label}
                        {col.sortable && <ArrowUpDown size={12} className={sortBy.field === col.key ? 'text-gray-900 dark:text-white' : ''} />}
                      </div>
                    </th>
                  ))}
                  <th className="w-20 px-4 py-3 text-center text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('list.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {isLoading ? (
                  <tr><td colSpan="9" className="px-4 py-10 text-center">
                    <Loader2 size={28} className="mx-auto text-gray-400 animate-spin mb-3" />
                    <p className="text-xs text-gray-500">{t('list.loading')}</p>
                  </td></tr>
                ) : sortedProducts.length === 0 ? (
                  <tr><td colSpan="9" className="px-4 py-10 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('list.empty.title')}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      {searchQuery || selectedCategory !== 'all' ? t('list.empty.search') : t('list.empty.first')}
                    </p>
                  </td></tr>
                ) : sortedProducts.map((product) => {
                  const statusCfg = getStatusConfig(product.stock, product.isActive);
                  return (
                    <tr key={product.id}
                      className={`hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${selectedProducts.includes(product.id) ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border border-gray-200 dark:border-zinc-700">
                            <img
                              src={product.productImage || product.imagesProduct?.[0]?.imageUrl || '/placeholder-product.png'}
                              alt={product.name} className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/placeholder-product.png'; }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-xs truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              onClick={() => navigate(`/dashboard/products/${product.id}`)}
                              title={product.name}>
                              {product.name?.length > 20 ? `${product.name.substring(0, 20)}...` : product.name}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                              {product.desc ? (product.desc.length > 20 ? `${product.desc.substring(0, 20)}...` : product.desc) : t('list.no_description')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {product.showsCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700 dark:text-zinc-300">
                          {product.category?.name || t('list.uncategorized')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white text-xs">{formatPrice(product.price)}</span>
                          {product.priceOriginal && (
                            <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.priceOriginal)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${product.stock === 0 ? 'bg-rose-500' : product.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className={`text-xs font-medium ${product.stock === 0 ? 'text-rose-600 dark:text-rose-400' : product.stock < 5 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-zinc-300'}`}>
                            {product.stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleProductStatus(product.id, product.isActive)}>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.style}`}>
                            {statusCfg.label}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-gray-500 dark:text-zinc-400">{formatDate(product.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5">
                          <Link to={`/dashboard/products/${product.slug || product.id}`} className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors">
                            <Eye size={14} />
                          </Link>
                          <Link to={`/dashboard/products/edit/${product.id}`} className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors">
                            <Edit2 size={14} />
                          </Link>
                          <button onClick={() => setDeleteModal({ isOpen: true, productId: product.id, productName: product.name })} className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
              <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                {t('list.pagination', { from: (currentPage - 1) * itemsPerPage + 1, to: Math.min(currentPage * itemsPerPage, totalItems), total: totalItems })}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 text-gray-400 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                  {isRtl ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i));
                    return (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors ${currentPage === p ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 text-gray-400 disabled:opacity-30 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                  {isRtl ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
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