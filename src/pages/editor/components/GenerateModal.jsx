import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { X, Sparkles, Loader2, Search, Package, Check, ImagePlus, Trash2 } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const MAX_PHOTOS = 3;

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
                onClick={() => onSelect(product.id, product)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl border transition-all text-start ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                    : 'border-gray-200 dark:border-zinc-800 hover:border-amber-300'
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

// صور المنتج عبر الخادم (R2 لا يسمح للمتصفح بقراءتها مباشرة) — حتى 3، والمفقودة تُتجاهل
function fetchProductPhotos(pageId, productId) {
  return Promise.all(
    Array.from({ length: MAX_PHOTOS }, (_, n) =>
      axios
        .get(`${baseURL}/builder-pages/${pageId}/image-page-product-photo`, {
          params: { productId, n },
          responseType: 'blob',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        })
        .then((r) => r.data)
        .catch(() => null),
    ),
  ).then((blobs) => blobs.filter(Boolean).map((blob) => ({ blob, url: URL.createObjectURL(blob) })));
}

// تُركَّب عند الفتح فقط: منتج الصفحة يُختار مسبقًا وتُجلب صوره
export default function GenerateModal({ open, onClose, onSubmit, generating, isDemo, imagePage, pageId, pageProductId }) {
  const { t, i18n } = useTranslation();
  // صفحة الصور هي الطريقة الوحيدة؛ «بلوكات» تبقى فقط للتجربة المجانية (demo) لأنها بلا صفحة حقيقية
  const kind = isDemo ? 'blocks' : 'images';
  const [mode, setMode] = useState('product'); // 'product' | 'manual'
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState(pageProductId || null);
  const [language, setLanguage] = useState(['ar', 'fr', 'en'].includes(i18n.language) ? i18n.language : 'ar');
  const [loadingPhotos, setLoadingPhotos] = useState(!isDemo && !!pageProductId && !!pageId);
  const [price, setPrice] = useState('');
  const [primaryColor, setPrimaryColor] = useState(null); // null = ألوان تلقائية
  const [photos, setPhotos] = useState([]); // [{ blob, url }]
  const fileInput = useRef(null);
  const photoRequest = useRef(0);

  const isImages = kind === 'images';
  const busy = generating || !!imagePage?.step;
  const usage = imagePage?.usage || { used: 0, limit: 0 };
  const limitReached = isImages && usage.used >= usage.limit;

  // روابط المعاينة تُحرَّر عند الاستبدال/الإغلاق
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  // منتج الصفحة: صوره تُجلب مرة واحدة عند الفتح
  useEffect(() => {
    if (isDemo || !pageProductId || !pageId) return;
    const requestId = (photoRequest.current += 1);
    fetchProductPhotos(pageId, pageProductId).then((list) => {
      if (requestId !== photoRequest.current) return;
      setPhotos(list);
      setLoadingPhotos(false);
    });
  }, [isDemo, pageId, pageProductId]);


  if (!open) return null;

  const addPhotos = (blobs) => {
    setPhotos((prev) => [...prev, ...blobs.map((blob) => ({ blob, url: URL.createObjectURL(blob) }))].slice(0, MAX_PHOTOS));
  };

  const handleSelectProduct = async (id) => {
    setProductId(id);
    if (!isImages || !pageId) return;
    const requestId = (photoRequest.current += 1);
    setLoadingPhotos(true);
    const list = await fetchProductPhotos(pageId, id);
    if (requestId !== photoRequest.current) return; // اختار منتجًا آخر في الأثناء
    setPhotos(list);
    setLoadingPhotos(false);
  };

  const hasSource = mode === 'product' ? !!productId : !!description.trim();
  const canSubmit = isImages ? hasSource && photos.length > 0 && !limitReached && !loadingPhotos : hasSource;

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    const base = {
      kind,
      productId: mode === 'product' ? productId : undefined,
      description: mode === 'manual' ? description.trim() : undefined,
      language,
    };
    const ok = await onSubmit(
      isImages
        ? { ...base, files: photos.map((p) => p.blob), style: 'auto', primaryColor: primaryColor || undefined, price: mode === 'manual' && price !== '' ? Number(price) : undefined }
        : base,
    );
    if (ok) onClose();
  };

  const pill = (active) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 ${
      active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
    }`;
  const input =
    'w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-3 disabled:opacity-60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5">
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={busy}>
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {[
            ['product', 'editor.generate.pickProduct'],
            ['manual', 'editor.generate.manualDescription'],
          ].map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={busy}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
                mode === m ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {mode === 'product' ? (
          <div className="mb-3">
            <ProductPicker selectedProductId={productId} onSelect={handleSelectProduct} />
          </div>
        ) : (
          <>
            <textarea
              rows={isImages ? 3 : 5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('editor.generate.placeholder')}
              disabled={busy}
              className={input}
            />
            {isImages && (
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('editor.imagePage.price')}
                disabled={busy}
                className={input}
              />
            )}
          </>
        )}

        {isImages && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">{t('editor.imagePage.photos')}</p>
            <p className="text-[11px] text-gray-400 mb-2">{t('editor.imagePage.photosHint')}</p>
            <div className="flex gap-2">
              {photos.map((p, i) => (
                <div key={p.url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 end-0.5 p-0.5 rounded-md bg-black/60 text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {loadingPhotos && (
                <div className="w-16 h-16 rounded-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
              {!loadingPhotos && photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInput.current?.click()}
                  title={t('editor.imagePage.addPhoto')}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-400 hover:border-amber-400 hover:text-amber-500 disabled:opacity-60"
                >
                  <ImagePlus size={18} />
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addPhotos([...(e.target.files || [])]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          {LANGUAGES.map((lang) => (
            <button key={lang.value} type="button" onClick={() => setLanguage(lang.value)} disabled={busy} className={pill(language === lang.value)}>
              {lang.label}
            </button>
          ))}
        </div>

        {isImages && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-0.5">{t('editor.imagePage.primaryColor')}</p>
            <p className="text-[11px] text-gray-400 mb-2">{t('editor.imagePage.primaryColorHint')}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPrimaryColor(null)} disabled={busy} className={pill(!primaryColor)}>
                {t('editor.imagePage.styles.auto')}
              </button>
              <label
                className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-xs font-semibold ${
                  primaryColor ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                }`}
              >
                <input
                  type="color"
                  value={primaryColor || '#f59e0b'}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={busy}
                  className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                />
                {primaryColor || t('editor.imagePage.pickColor')}
              </label>
            </div>
          </div>
        )}

        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">{t('editor.generate.warning')}</p>

        {isImages && (
          <p className={`text-[11px] mb-3 ${limitReached ? 'text-rose-500 font-semibold' : 'text-gray-500 dark:text-zinc-400'}`}>
            {usage.limit === 0
              ? t('editor.imagePage.unavailable')
              : limitReached
                ? t('editor.imagePage.upgrade')
                : t('editor.imagePage.usage', { used: usage.used, limit: usage.limit })}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={busy || !canSubmit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-all"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {imagePage?.step ? t(`editor.imagePage.steps.${imagePage.step}`) : busy ? t('editor.generate.generating') : t('editor.generate.submit')}
        </button>
      </div>
    </div>
  );
}
