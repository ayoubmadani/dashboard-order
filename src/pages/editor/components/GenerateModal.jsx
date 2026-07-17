import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { X, Sparkles, Loader2, Search, Package, Check } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const LANGUAGES = [
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
];

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
    <div>
      <div className="relative mb-2">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('editor.generate.searchProducts')}
          className="w-full ps-9 pe-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1.5 pe-1">
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
                onClick={() => onSelect(product.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl border transition-all text-start ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                    : 'border-gray-200 dark:border-zinc-800 hover:border-amber-300'
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
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{product.price} د.ج</p>
                </div>
                {isSelected && <Check size={16} className="text-amber-500 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function GenerateModal({ open, onClose, onSubmit, generating, isDemo }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('product'); // 'product' | 'manual'
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState(null);
  const [language, setLanguage] = useState('ar');

  if (!open) return null;

  const canSubmit = mode === 'product' ? !!productId : !!description.trim();

  const handleSubmit = async () => {
    if (!canSubmit || generating) return;
    const ok = await onSubmit({
      productId: mode === 'product' ? productId : undefined,
      description: mode === 'manual' ? description.trim() : undefined,
      language,
    });
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('editor.generate.title')}</h3>
            {isDemo && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {t('editor.generate.freeTrial')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={generating}>
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode('product')}
            disabled={generating}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
              mode === 'product'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
            }`}
          >
            {t('editor.generate.pickProduct')}
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            disabled={generating}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
              mode === 'manual'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
            }`}
          >
            {t('editor.generate.manualDescription')}
          </button>
        </div>

        {mode === 'product' ? (
          <div className="mb-3">
            <ProductPicker selectedProductId={productId} onSelect={setProductId} />
          </div>
        ) : (
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('editor.generate.placeholder')}
            disabled={generating}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-3 disabled:opacity-60"
          />
        )}

        <div className="flex items-center gap-2 mb-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => setLanguage(lang.value)}
              disabled={generating}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 ${
                language === lang.value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3">{t('editor.generate.warning')}</p>

        <button
          onClick={handleSubmit}
          disabled={generating || !canSubmit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? t('editor.generate.generating') : t('editor.generate.submit')}
        </button>
      </div>
    </div>
  );
}
