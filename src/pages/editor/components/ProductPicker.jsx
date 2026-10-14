import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Search, Loader2, Package, Check } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// قائمة منتجات المتجر مع بحث — لاختيار منتج صفحة الهبوط (عند الإنشاء أو من إعدادات الصفحة)
export default function ProductPicker({ selectedProductId, onSelect }) {
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
                  {product.imagesProduct?.[0]?.imageUrl ? (
                    <img src={product.imagesProduct[0].imageUrl} alt="" className="w-full h-full object-cover" />
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
