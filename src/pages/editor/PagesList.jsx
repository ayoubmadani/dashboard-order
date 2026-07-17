import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import {
  LayoutTemplate, Plus, Search, X, Trash2, Pencil,
  ExternalLink, Loader2, AlertCircle, RefreshCw, Sparkles,
  Package, ChevronDown, Check,
} from 'lucide-react';
import { baseURL } from '../../constents/const.';
import { getAccessToken } from '../../services/access-token';
import Loading from '../../components/Loading';

const slugify = (str) =>
  str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');

function ProductPicker({ selectedProductId, onSelect }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const storeId = localStorage.getItem('storeId');
      if (!storeId) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const token = getAccessToken();
      setLoading(true);
      const params = new URLSearchParams({ page: '1', limit: '20', ...(search && { search }) });
      axios
        .get(`${baseURL}/stores/${storeId}/products?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setProducts(res.data?.products || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-2">
      <div className="relative mb-2">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('editor.generate.searchProducts')}
          className="w-full ps-9 pe-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 pe-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">{t('editor.generate.noProducts')}</p>
        ) : (
          products.map((product) => {
            const isSelected = product.id === selectedProductId;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl border transition-all text-start ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-zinc-800 hover:border-emerald-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                  {product.productImage ? (
                    <img src={product.productImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={14} className="text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                </div>
                {isSelected && <Check size={16} className="text-emerald-500 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PagesList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [domains, setDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const storeId = localStorage.getItem('storeId');
  const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}` });

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${baseURL}/builder-pages/store/${storeId}`, { headers: authHeaders() });
      setPages(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || t('editor.list.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [storeId, t]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    if (!showCreateModal || !storeId) return;
    setDomainsLoading(true);
    axios
      .get(`${baseURL}/domain/store/${storeId}`, { headers: authHeaders() })
      .then((res) => setDomains(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => setDomains([]))
      .finally(() => setDomainsLoading(false));
  }, [showCreateModal, storeId]);

  const handleNameChange = (value) => {
    setNewPageName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPageName('');
    setSelectedProduct(null);
    setProductPickerOpen(false);
    setSelectedDomain('');
    setSlug('');
    setSlugTouched(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const domain = selectedDomain && slug.trim() ? `${selectedDomain}/lp/${slug.trim()}` : undefined;
      const res = await axios.post(
        `${baseURL}/builder-pages`,
        { name: newPageName || t('editor.list.untitled'), storeId, productId: selectedProduct?.id, domain },
        { headers: authHeaders() }
      );
      navigate(`/editor/${res.data.id}`);
      closeCreateModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('editor.list.createError'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('editor.list.confirmDelete'))) return;
    setDeletingId(id);
    try {
      await axios.delete(`${baseURL}/builder-pages/${id}`, { headers: authHeaders() });
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('editor.list.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPages = pages.filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <Loading />;

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gray-50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>
      <Toaster position="top-center" richColors />

      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
                <LayoutTemplate size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {t('editor.list.title')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {pages.length} {t('editor.list.pagesCount')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                <input
                  type="text"
                  placeholder={t('editor.list.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full sm:w-64 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all`}
                />
              </div>

              <button
                onClick={fetchPages}
                className="p-2.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all shrink-0"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={() => navigate('/editor/demo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors shrink-0"
              >
                <Sparkles size={18} />
                <span className="hidden sm:inline">{t('editor.list.tryDemo')}</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shrink-0 shadow-lg"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{t('editor.list.createNew')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {filteredPages.length === 0 ? (
          <div className="w-full h-[300px] flex flex-col justify-center items-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <LayoutTemplate size={20} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {searchQuery ? t('editor.list.noResults') : t('editor.list.emptyTitle')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {searchQuery ? t('editor.list.noResultsSub') : t('editor.list.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPages.map((page) => (
              <div
                key={page.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-300 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{page.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        page.publishedUrl
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                      }`}
                    >
                      {page.publishedUrl ? t('editor.list.published') : t('editor.list.draft')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/editor/${page.id}`)}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                      title={t('editor.list.openEditor')}
                    >
                      <Pencil size={16} />
                    </button>
                    {page.publishedUrl && (
                      <a
                        href={page.publishedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(page.id)}
                    disabled={deletingId === page.id}
                    className="p-2.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {deletingId === page.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('editor.list.createNew')}</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={newPageName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('editor.list.namePlaceholder')}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 mb-4"
            />

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
                {t('editor.list.productLabel')}
              </label>
              {selectedProduct ? (
                <button
                  type="button"
                  onClick={() => setProductPickerOpen((v) => !v)}
                  className="w-full flex items-center gap-2.5 p-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0 flex items-center justify-center">
                    {selectedProduct.productImage ? (
                      <img src={selectedProduct.productImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={14} className="text-gray-400" />
                    )}
                  </div>
                  <span className="flex-1 text-start text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedProduct.name}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); }}
                    className="p-1 text-gray-400 hover:text-rose-500"
                  >
                    <X size={14} />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setProductPickerOpen((v) => !v)}
                  className="w-full flex items-center justify-between p-2.5 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-500 hover:border-emerald-500 transition-all"
                >
                  <span>{t('editor.fields.selectProduct')}</span>
                  <ChevronDown size={16} />
                </button>
              )}

              {productPickerOpen && (
                <div className="mt-2">
                  <ProductPicker
                    selectedProductId={selectedProduct?.id}
                    onSelect={(product) => { setSelectedProduct(product); setProductPickerOpen(false); }}
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
                {t('editor.list.domainLabel')}
              </label>
              <div className="flex items-stretch">
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="shrink-0 max-w-[42%] px-2 py-2.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-s-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">{domainsLoading ? t('editor.fields.loadingProducts') : t('editor.list.domainPlaceholder')}</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.domain}>{d.domain}</option>
                  ))}
                </select>
                <span className="flex items-center px-1.5 bg-gray-100 dark:bg-zinc-800 border-y border-gray-200 dark:border-zinc-700 text-xs text-gray-400 shrink-0">
                  /lp/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                  placeholder="example-page"
                  className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-e-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              {!domainsLoading && domains.length === 0 && (
                <p className="text-[11px] text-gray-400 mt-1">{t('editor.list.noDomains')}</p>
              )}
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {t('editor.list.createNew')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
