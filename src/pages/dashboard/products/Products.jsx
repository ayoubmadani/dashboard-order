import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Filter,
  Edit2, Trash2, Eye, Package,
  X, CheckCircle2,
  Download, Upload, RefreshCw,
  ArrowLeft, ArrowRight,
  Loader2, AlertTriangle, TrendingUp,
  ToggleLeft, ToggleRight, SlidersHorizontal,
  ChevronLeft, ChevronRight,
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
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
    } catch (error) {
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
    } catch (error) {}
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
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: !p.isActive } : p));
    try {
      await axios.patch(
        `${baseURL}/stores/${storeId}/products/${productId}/toggle-active`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(currentStatus ? t('list.toast.status_disabled') : t('list.toast.status_enabled'));
    } catch {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: currentStatus } : p));
      toast.error(t('list.toast.status_failed'));
    }
  };

  const toggleSelection = (id) =>
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedProducts(selectedProducts.length === products.length ? [] : products.map(p => p.id));

  const sortedProducts = [...products].sort((a, b) => {
    const aVal = a[sortBy.field], bVal = b[sortBy.field];
    return sortBy.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat(isRtl ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(price);

  const formatDate = (d) => new Date(d).toLocaleDateString(isRtl ? 'ar-DZ' : 'fr-DZ');

  const requiredText = (() => {
    const words = deleteModal.productName.trim().split(/\s+/);
    return (words.length > 1 ? `${words[0]} ${words[1]}` : words[0] || '').substring(0, 15);
  })();

  const activeCount = products.filter(p => p.isActive).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950" dir={isRtl ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Trash2 size={26} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-1">
              {t('list.delete_modal.title')}
            </h3>
            <p className="text-sm text-center text-gray-500 dark:text-zinc-400 mb-5">
              {t('list.delete_modal.about_to_delete')}{' '}
              <span className="font-semibold text-gray-800 dark:text-zinc-200">"{deleteModal.productName}"</span>
            </p>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 mb-5">
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2 text-center">
                {t('list.delete_modal.type_to_confirm')}
              </p>
              <p className="text-center font-mono font-bold text-rose-600 dark:text-rose-400 mb-3 text-sm">
                {requiredText}
              </p>
              <input
                type="text"
                placeholder={t('list.delete_modal.type_placeholder')}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-rose-500 dark:bg-zinc-900 dark:text-white text-sm text-center font-medium transition-all"
                onChange={(e) => setConfirmName(e.target.value)}
                value={confirmName}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal({ isOpen: false, productId: null, productName: '' }); setConfirmName(''); }}
                className="flex-1 px-4 py-2.5 text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors font-medium text-sm"
              >
                {t('list.delete_modal.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmName !== requiredText}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${confirmName === requiredText ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/25' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'}`}
              >
                {t('list.delete_modal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-350 mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('list.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{t('list.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="p-2.5 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button className="p-2.5 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
              <Upload size={16} />
            </button>
            <button className="p-2.5 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
              <Download size={16} />
            </button>
            <Link
              to="/dashboard/products/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              <Plus size={16} />
              {t('list.new_product')}
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('list.total', { count: '' }).replace(/\d+/, '').trim() || 'الكل', value: totalItems, color: 'text-gray-900 dark:text-white', bg: 'bg-white dark:bg-zinc-900', icon: Package, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-50 dark:bg-indigo-500/10' },
            { label: t('list.status_active'), value: activeCount, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-white dark:bg-zinc-900', icon: CheckCircle2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: t('list.status_inactive'), value: products.length - activeCount, color: 'text-gray-500 dark:text-zinc-400', bg: 'bg-white dark:bg-zinc-900', icon: TrendingUp, iconColor: 'text-gray-400', iconBg: 'bg-gray-50 dark:bg-zinc-800' },
            { label: t('list.table.stock'), value: outOfStock, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-white dark:bg-zinc-900', icon: AlertTriangle, iconColor: 'text-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3`}>
              <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={18} className={s.iconColor} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-4' : 'left-4'}`} size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('list.search_placeholder')}
                className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm dark:text-white transition-all ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${showFilters ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600'}`}
              >
                <SlidersHorizontal size={15} />
                {t('list.filters')}
              </button>
              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium">
                    <CheckCircle2 size={14} />
                    {selectedProducts.length}
                    <button onClick={() => setSelectedProducts([])} className="hover:text-indigo-800">
                      <X size={13} />
                    </button>
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 size={14} />
                    {t('list.bulk_delete_selected')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl text-sm dark:text-white outline-none focus:border-indigo-400 transition-all"
              >
                <option value="all">{t('list.all_categories')}</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl text-sm dark:text-white outline-none focus:border-indigo-400 transition-all"
              >
                <option value="all">{t('list.all_statuses')}</option>
                <option value="active">{t('list.status_active')}</option>
                <option value="inactive">{t('list.status_inactive')}</option>
              </select>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); setSearchQuery(''); setCurrentPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-colors"
              >
                <X size={14} />
                {t('list.clear_filters')}
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-400 dark:text-zinc-500">{t('list.loading')}</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <Package size={28} className="text-gray-300 dark:text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 dark:text-zinc-200">{t('list.empty.title')}</p>
                <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
                  {searchQuery || selectedCategory !== 'all' ? t('list.empty.search') : t('list.empty.first')}
                </p>
              </div>
              {!searchQuery && selectedCategory === 'all' && (
                <Link
                  to="/dashboard/products/create"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  <Plus size={16} />
                  {t('list.new_product')}
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    <th className="px-5 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 accent-indigo-600 cursor-pointer"
                      />
                    </th>
                    {[
                      { key: 'name', label: t('list.table.product') },
                      { key: 'category', label: t('list.table.category') },
                      { key: 'price', label: t('list.table.price') },
                      { key: 'stock', label: t('list.table.stock') },
                      { key: 'show', label: t('list.table.show') },
                      { key: 'status', label: t('list.table.status') },
                      { key: 'createdAt', label: t('list.table.date') },
                    ].map(col => (
                      <th
                        key={col.key}
                        className={`px-4 py-3.5 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider text-center">
                      {t('list.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product, idx) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-50 dark:border-zinc-800/70 last:border-0 transition-colors group ${
                        selectedProducts.includes(product.id)
                          ? 'bg-indigo-50/60 dark:bg-indigo-500/5'
                          : 'hover:bg-gray-50/70 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Product */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border border-gray-100 dark:border-zinc-700">
                            <img
                              src={product.productImage || product.imagesProduct?.[0]?.imageUrl || '/placeholder-product.png'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-semibold text-gray-800 dark:text-zinc-100 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              onClick={() => navigate(`/dashboard/products/${product.id}`)}
                              title={product.name}
                            >
                              {product.name?.length > 22 ? `${product.name.substring(0, 22)}…` : product.name}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                              {product.desc ? (product.desc.length > 24 ? `${product.desc.substring(0, 24)}…` : product.desc) : t('list.no_description')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-block px-2.5 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-medium">
                          {product.category?.name || t('list.uncategorized')}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
                        {product.priceOriginal && (
                          <p className="text-xs text-gray-400 dark:text-zinc-500 line-through mt-0.5">{formatPrice(product.priceOriginal)}</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          product.stock === 0
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : product.stock < 5
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            product.stock === 0 ? 'bg-rose-500' : product.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {product.stock}
                        </span>
                      </td>

                      {/* Shows */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 dark:text-zinc-300 font-medium">
                          {product.showsCount || 0}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.isActive)}
                          className="flex items-center gap-2 group/toggle"
                        >
                          {product.isActive ? (
                            <ToggleRight size={22} className="text-emerald-500 group-hover/toggle:text-emerald-600 transition-colors" />
                          ) : (
                            <ToggleLeft size={22} className="text-gray-300 dark:text-zinc-600 group-hover/toggle:text-gray-400 transition-colors" />
                          )}
                          <span className={`text-xs font-medium ${product.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                            {product.isActive ? t('list.status_badge.active') : t('list.status_badge.disabled')}
                          </span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(product.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/dashboard/products/${product.slug || product.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            to={`/dashboard/products/edit/${product.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, productId: product.id, productName: product.name })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                {t('list.pagination', {
                  from: (currentPage - 1) * itemsPerPage + 1,
                  to: Math.min(currentPage * itemsPerPage, totalItems),
                  total: totalItems,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
                >
                  {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i));
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === p
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
                >
                  {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
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
