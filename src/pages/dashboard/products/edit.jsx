import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Info, Palette, ImageIcon, Plus, Trash2,
  Tag, Bold, Italic, List, CheckCircle, AlertCircle,
  Loader2, Sparkles, Package, Rocket, Ruler,
  Type as TypeIcon, Save, ArrowRight, Grid3x3,
  FolderTree, ChevronDown, X, Check, RefreshCw
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ModelImages from '../../../components/ModelImages';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const ATTRIBUTE_TYPES = { COLOR: 'color', SIZE: 'size', TEXT: 'text' };
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/* ── Text Editor ── */
const TextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3 dark:text-white text-sm',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
      <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
        {[
          { action: () => editor.chain().focus().toggleBold().run(), icon: <Bold size={14} />, active: editor.isActive('bold') },
          { action: () => editor.chain().focus().toggleItalic().run(), icon: <Italic size={14} />, active: editor.isActive('italic') },
          { action: () => editor.chain().focus().toggleBulletList().run(), icon: <List size={14} />, active: editor.isActive('bulletList') },
        ].map((btn, i) => (
          <button key={i} type="button" onClick={btn.action}
            className={`p-1.5 rounded-lg transition-all ${btn.active ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}>
            {btn.icon}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

/* ── Section Card ── */
const Section = ({ icon: Icon, title, color = 'indigo', children }) => {
  const colors = {
    indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
    purple: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
    teal: 'text-teal-500 bg-teal-50 dark:bg-teal-500/10',
    rose: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={16} />
        </div>
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide uppercase">{title}</h2>
      </div>
      <div className="p-5 space-y-4 overflow-visible">{children}</div>
    </div>
  );
};

/* ── Field wrapper ── */
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-rose-500 font-medium mt-1">
        <AlertCircle size={12} />{error}
      </p>
    )}
  </div>
);

const inputCls = (err) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-gray-50 dark:bg-zinc-950 dark:text-white
  ${err ? 'border-rose-400 focus:border-rose-500' : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'}`;

/* ══════════════════════════════════════════════════════ */
export default function EditProduct() {
  const { t: translate, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRtl = i18n.dir() === 'rtl';
  const t = (key) => translate(`translation:products.${key}`);

  /* ── state ── */
  const [formData, setFormData] = useState({
    name: '', desc: '', price: '', originalPrice: '',
    storeId: '', sku: '', stock: '', status: 'active', categoryId: ''
  });
  const [attributes, setAttributes] = useState([]);
  const [variantDetails, setVariantDetails] = useState([]);
  const [offers, setOffers] = useState([]);
  const [images, setImages] = useState([]);
  const [isOpenModelImage, setIsOpenModelImage] = useState(false);
  const [selectingImageFor, setSelectingImageFor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  /* ── categories ── */
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const loadCategories = () => {
    const storeId = localStorage.getItem('storeId');
    if (!storeId) { setCategoriesError('storeId غير موجود في localStorage'); return; }
    const token = getAccessToken();
    if (!token) { setCategoriesError('token غير موجود'); return; }
    setCategoriesLoading(true);
    setCategoriesError('');
    axios.get(`${baseURL}/stores/${storeId}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const raw = res.data;
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.categories)) list = raw.categories;
        else if (Array.isArray(raw?.items)) list = raw.items;
        else if (Array.isArray(raw?.result)) list = raw.result;
        setCategories(list);
      })
      .catch(err => {
        setCategoriesError(err.response?.data?.message || err.message || 'خطأ في جلب التصنيفات');
        setCategories([]);
      })
      .finally(() => setCategoriesLoading(false));
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (!categoryDropdownOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-category-dropdown]')) setCategoryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [categoryDropdownOpen]);

  /* ── fetch product ── */
  useEffect(() => {
    if (!id) { navigate('/dashboard/products'); return; }
    const fetchProduct = async () => {
      try {
        setIsFetching(true);
        const token = getAccessToken();
        const storeId = localStorage.getItem('storeId');
        if (!storeId) { navigate('/dashboard/products'); return; }

        const res = await axios.get(`${baseURL}/stores/${storeId}/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const product = res.data?.data || res.data;
        if (!product) { navigate('/dashboard/products'); return; }

        // Basic info
        setFormData({
          name: product.name || '',
          desc: product.desc || '',
          price: product.price?.toString() || '',
          originalPrice: product.priceOriginal?.toString() || '',
          storeId: storeId,
          sku: product.sku || '',
          stock: product.stock?.toString() || '',
          status: product.isActive !== false ? 'active' : 'inactive',
          categoryId: product.category?.id || product.categoryId || ''
        });

        // Attributes
        if (Array.isArray(product.attributes)) {
          setAttributes(product.attributes.map(attr => ({ ...attr, variants: attr.variants || [] })));
        }

        // Variant Details
        if (Array.isArray(product.variantDetails)) {
          setVariantDetails(product.variantDetails.map(vd => {
            let parsedName = vd.name;
            try {
              if (typeof vd.name === 'string' && (vd.name.startsWith('{') || vd.name.startsWith('['))) {
                parsedName = JSON.parse(vd.name);
              }
            } catch { parsedName = vd.name; }
            return { ...vd, name: parsedName, price: vd.price?.toString() || '', stock: vd.stock?.toString() || '' };
          }));
        }

        // Offers
        if (Array.isArray(product.offers) && product.offers.length > 0) {
          setOffers(product.offers.map(o => ({
            ...o, price: o.price?.toString() || '', quantity: o.quantity?.toString() || ''
          })));
        }

        // Images
        if (Array.isArray(product.imagesProduct) && product.imagesProduct.length > 0) {
          setImages(product.imagesProduct.map(img => img.imageUrl || img.url).filter(Boolean));
        } else if (product.productImage) {
          setImages([product.productImage]);
        }

      } catch (err) {
        console.error('Error fetching product:', err);
        showNotification('error', t('Failed.to.load.product'));
      } finally {
        setIsFetching(false);
      }
    };
    fetchProduct();
  }, [id]);

  /* ── helpers ── */
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  /* ── attributes ── */
  const addAttribute = (type, name = '') => {
    if ((type === ATTRIBUTE_TYPES.COLOR || type === ATTRIBUTE_TYPES.SIZE) && attributes.some(a => a.type === type)) {
      showNotification('error', t('Attribute.already.exists')); return;
    }
    const base = { id: `att-${Date.now()}`, type, name: name || (type === ATTRIBUTE_TYPES.COLOR ? t('Colors') : type === ATTRIBUTE_TYPES.SIZE ? t('Add.Size') : '') };
    const attr = type === ATTRIBUTE_TYPES.COLOR
      ? { ...base, displayMode: 'color', variants: [] }
      : type === ATTRIBUTE_TYPES.SIZE
        ? { ...base, variants: DEFAULT_SIZES.map((s, i) => ({ id: `var-${Date.now()}-${i}`, name: s, value: s })) }
        : { ...base, variants: [] };
    setAttributes(prev => [...prev, attr]);
    setVariantDetails([]);
  };

  const removeAttribute = (id) => { setAttributes(prev => prev.filter(a => a.id !== id)); };
  const updateAttributeName = (id, name) => { setAttributes(prev => prev.map(a => a.id === id ? { ...a, name } : a)); setVariantDetails([]); };
  const updateDisplayMode = (id, mode) => { setAttributes(prev => prev.map(a => a.id === id && a.type === ATTRIBUTE_TYPES.COLOR ? { ...a, displayMode: mode, variants: [] } : a)); setVariantDetails([]); };

  const addVariant = (attrId) => {
    setAttributes(prev => prev.map(a => a.id !== attrId ? a : { ...a, variants: [...a.variants, { id: `var-${Date.now()}`, name: '', value: '' }] }));
    setVariantDetails([]);
  };

  const updateVariantValue = (attrId, variantId, value, imgId = null) => {
    setAttributes(prev => prev.map(a => {
      if (a.id !== attrId) return a;
      return {
        ...a, variants: a.variants.map(v => {
          if (v.id !== variantId) return v;
          if (a.type === ATTRIBUTE_TYPES.COLOR && a.displayMode === 'image') return { ...v, value, name: value, imageId: imgId };
          return { ...v, value, name: value };
        })
      };
    }));
    setVariantDetails([]);
  };

  const removeVariant = (attrId, variantId) => {
    setAttributes(prev => prev.map(a => a.id !== attrId ? a : { ...a, variants: a.variants.filter(v => v.id !== variantId) }));
    setVariantDetails([]);
  };

  /* ── variant combinations ── */
  const generateVariantCombinations = () => {
    if (!attributes.length) { showNotification('error', t('Add.attributes.first')); return; }
    if (attributes.some(a => !a.variants.length)) { showNotification('error', t('Some.attributes.have.no.variants')); return; }
    const combinations = [];
    const gen = (combo, idx) => {
      if (idx === attributes.length) { combinations.push({ ...combo }); return; }
      attributes[idx].variants.forEach(v => gen({ ...combo, [attributes[idx].name]: v.name }, idx + 1));
    };
    gen({}, 0);
    setVariantDetails(combinations.map((c, i) => ({ id: `vd-${Date.now()}-${i}`, name: c, price: formData.price || '', stock: '' })));
    showNotification('success', `${t('Generated')} ${combinations.length} ${t('combinations')}`);
  };

  const removeVariantDetail = (id) => setVariantDetails(prev => prev.filter(d => d.id !== id));
  const updateVDPrice = (id, price) => setVariantDetails(prev => prev.map(d => d.id === id ? { ...d, price } : d));
  const updateVDStock = (id, stock) => setVariantDetails(prev => prev.map(d => d.id === id ? { ...d, stock } : d));

  /* ── offers ── */
  const addOffer = () => setOffers(prev => [...prev, { id: `off-${Date.now()}`, name: '', quantity: '', price: '' }]);
  const removeOffer = (id) => setOffers(prev => prev.filter(o => o.id !== id));
  const updateOffer = (id, field, val) => setOffers(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o));

  /* ── images ── */
  const openImageSelectorForVariant = (attrId, variantId) => { setSelectingImageFor({ attrId, variantId }); setIsOpenModelImage(true); };
  const handleImageSelect = (imageData) => {
    if (selectingImageFor) {
      updateVariantValue(selectingImageFor.attrId, selectingImageFor.variantId, imageData.url, imageData.id);
      setSelectingImageFor(null);
    } else {
      setImages(prev => [...prev, imageData.url]);
    }
    showNotification('success', t('Image.added.successfully'));
  };

  /* ── validate + submit ── */
  const validate = () => {
    const e = {};
    const hasText = /[a-zA-Z0-9\u0600-\u06FF]/.test(formData.name || '');
    if (!formData.name?.trim() || !hasText) e.name = t('Product.name.must.contain.text');
    if (!formData.price || Number(formData.price) <= 0) e.price = t('Please.enter.a.valid.price');
    attributes.forEach(a => {
      if (!a.name?.trim()) e[`attr_${a.id}`] = t('Attribute.name.required');
      if (!a.variants.length) e[`attr_empty_${a.id}`] = t('Add.at.least.one.variant');
      a.variants.forEach(v => { if (!v.name?.trim()) e[`variant_${v.id}`] = t('Variant.value.required'); });
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) { showNotification('error', t('Please.fix.errors.first')); return; }
    setLoading(true);
    try {
      const storeId = localStorage.getItem('storeId');
      const token = getAccessToken();
      const data = {
        name: formData.name,
        price: Number(formData.price),
        desc: formData.desc,
        sku: formData.sku,
        stock: Number(formData.stock) || 0,
        isActive: formData.status === 'active',
        priceOriginal: formData.originalPrice ? Number(formData.originalPrice) : null,
        categoryId: formData.categoryId || null,
        attributes,
        variantDetails,
        offers,
        images
      };
      const res = await axios.patch(`${baseURL}/stores/${storeId}/products/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        showNotification('success', t('Product.updated.successfully!'));
        setTimeout(() => navigate('/dashboard/products'), 1500);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', t('Error.updating.product'));
    } finally {
      setLoading(false);
    }
  };

  /* ── loading screen ── */
  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto">
            <Loader2 size={28} className="text-indigo-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('Loading.product...')}</p>
        </div>
      </div>
    );
  }

  /* ══ RENDER ══ */
  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>

      <ModelImages
        isOpen={isOpenModelImage}
        close={() => { setIsOpenModelImage(false); setSelectingImageFor(null); }}
        onSelectImage={handleImageSelect}
      />

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 ${isRtl ? 'left-4' : 'right-4'} z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold
          ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/products')}
            className="p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
            <ArrowRight className={isRtl ? '' : 'rotate-180'} size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={20} className="text-amber-500" />
              {t('Edit.Product')}
            </h1>
            <p className="text-xs text-gray-400 font-mono"># {id}</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? t('Updating...') : t('Update.Product')}
        </button>
      </div>

      {/* ── SECTION 1: Basic Info ── */}
      <Section icon={Info} title={t('Basic.Information')} color="indigo">

        <Field label={t('Product.Name')} required error={errors.name}>
          <input type="text" dir={isRtl ? 'rtl' : 'ltr'} value={formData.name}
            onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: null })); }}
            placeholder={t('e.g.Cotton.T.Shirt')}
            className={inputCls(errors.name)} />
        </Field>

        <Field label={t('Product.Description')}>
          <div dir={isRtl ? 'rtl' : 'ltr'}>
            <TextEditor value={formData.desc} onChange={v => setFormData(p => ({ ...p, desc: v }))} />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('Sale.Price')} required error={errors.price}>
            <div className="relative">
              <input type="number" dir="ltr" value={formData.price}
                onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                className={`${inputCls(errors.price)} ${isRtl ? 'pl-14' : 'pr-14'}`} />
              <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 ${isRtl ? 'left-3' : 'right-3'}`}>
                {isRtl ? 'د.ج' : 'DZD'}
              </span>
            </div>
          </Field>
          <Field label={t('Original.Price')}>
            <div className="relative">
              <input type="number" dir="ltr" value={formData.originalPrice}
                onChange={e => setFormData(p => ({ ...p, originalPrice: e.target.value }))}
                placeholder="0.00"
                className={`${inputCls()} ${isRtl ? 'pl-14' : 'pr-14'}`} />
              <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 ${isRtl ? 'left-3' : 'right-3'}`}>
                {isRtl ? 'د.ج' : 'DZD'}
              </span>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('SKU')}>
            <input type="text" dir="ltr" value={formData.sku}
              onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))}
              placeholder={t('e.g.PROD-001')}
              className={`${inputCls()} font-mono text-xs`} />
          </Field>
          <Field label={t('Stock.Quantity')}>
            <input type="number" dir="ltr" value={formData.stock}
              onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))}
              placeholder="0"
              className={inputCls()} />
          </Field>
        </div>

        {/* Status toggle */}
        <Field label="الحالة">
          <div className="flex gap-2">
            {['active', 'inactive'].map(s => (
              <button key={s} type="button"
                onClick={() => setFormData(p => ({ ...p, status: s }))}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border
                  ${formData.status === s
                    ? s === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-500'
                    : 'border-gray-200 dark:border-zinc-700 text-gray-400 hover:border-gray-300'}`}>
                {s === 'active' ? '✓ نشط' : '✕ غير نشط'}
              </button>
            ))}
          </div>
        </Field>

        {/* Category dropdown */}
        <Field label="التصنيف">
          <div className="relative" data-category-dropdown>
            <button type="button" onClick={() => setCategoryDropdownOpen(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm outline-none transition-all hover:border-indigo-400">
              {formData.categoryId ? (() => {
                const cat = categories.find(c => c.id === formData.categoryId);
                return cat ? (
                  <span className="flex items-center gap-2 text-gray-800 dark:text-white font-medium">
                    {cat.imageUrl
                      ? <img src={cat.imageUrl} alt="" className="w-5 h-5 rounded-md object-cover" />
                      : <FolderTree size={14} className="text-indigo-400" />}
                    {cat.name}
                  </span>
                ) : <span className="text-gray-400 flex items-center gap-2"><FolderTree size={14} />اختر تصنيفاً</span>;
              })() : (
                <span className="text-gray-400 flex items-center gap-2"><FolderTree size={14} />اختر تصنيفاً</span>
              )}
              <div className="flex items-center gap-2">
                {formData.categoryId && (
                  <span role="button" tabIndex={0}
                    onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, categoryId: '' })); }}
                    className="p-0.5 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer">
                    <X size={13} />
                  </span>
                )}
                <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-60 overflow-y-auto">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-gray-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">جاري التحميل...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="py-5 px-4 text-center space-y-2">
                    <p className="text-xs text-rose-500 font-medium">{categoriesError}</p>
                    <button type="button" onClick={loadCategories}
                      className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 underline">إعادة المحاولة</button>
                  </div>
                ) : !categories.length ? (
                  <div className="py-5 px-4 text-center space-y-2">
                    <p className="text-xs text-gray-400">لا توجد تصنيفات</p>
                    <button type="button" onClick={loadCategories}
                      className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 underline">تحديث</button>
                  </div>
                ) : (
                  <>
                    <button type="button"
                      onClick={() => { setFormData(p => ({ ...p, categoryId: '' })); setCategoryDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b border-gray-100 dark:border-zinc-800">
                      <X size={13} /> بدون تصنيف
                    </button>
                    {categories.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => { setFormData(p => ({ ...p, categoryId: cat.id })); setCategoryDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                          ${formData.categoryId === cat.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-200'}`}>
                        {cat.imageUrl
                          ? <img src={cat.imageUrl} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                          : <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <FolderTree size={13} className="text-gray-400" />
                            </div>}
                        <div className="text-left rtl:text-right flex-1 overflow-hidden">
                          <p className="font-medium truncate">{cat.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{cat.slug}</p>
                        </div>
                        {cat.products?.length > 0 && (
                          <span className="text-[10px] text-gray-400 shrink-0">{cat.products.length} منتج</span>
                        )}
                        {formData.categoryId === cat.id && <Check size={14} className="text-indigo-500 shrink-0" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {formData.categoryId && (() => {
            const cat = categories.find(c => c.id === formData.categoryId);
            return cat ? (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg w-fit">
                <FolderTree size={12} className="text-indigo-500" />
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{cat.name}</span>
              </div>
            ) : null;
          })()}
        </Field>
      </Section>

      {/* ── SECTION 2: Attributes ── */}
      <Section icon={Palette} title={t('Product.Attributes')} color="purple">

        {!attributes.length && (
          <p className="text-center text-sm text-gray-400 py-4">{t('No.attributes.added.yet')}</p>
        )}

        {attributes.map((attr) => (
          <div key={attr.id} className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 bg-gray-50 dark:bg-zinc-950 space-y-3">

            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${attr.type === ATTRIBUTE_TYPES.COLOR ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-500' : attr.type === ATTRIBUTE_TYPES.SIZE ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500' : 'bg-gray-200 dark:bg-zinc-700 text-gray-500'}`}>
                {attr.type === ATTRIBUTE_TYPES.COLOR ? <Palette size={14} /> : attr.type === ATTRIBUTE_TYPES.SIZE ? <Ruler size={14} /> : <TypeIcon size={14} />}
              </div>
              <input type="text" value={attr.name} onChange={e => updateAttributeName(attr.id, e.target.value)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 outline-none
                  ${errors[`attr_${attr.id}`] ? 'border-rose-400' : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'}`} />
              <button type="button" onClick={() => removeAttribute(attr.id)}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                <Trash2 size={14} />
              </button>
            </div>

            {attr.type === ATTRIBUTE_TYPES.COLOR && (
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg w-fit">
                {['color', 'image'].map(mode => (
                  <button key={mode} type="button" onClick={() => updateDisplayMode(attr.id, mode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${attr.displayMode === mode ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                    {mode === 'color' ? t('Colors') : t('Images')}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {attr.variants.map(variant => (
                <div key={variant.id} className="flex items-center gap-2">
                  {attr.type === ATTRIBUTE_TYPES.COLOR && attr.displayMode === 'color' ? (
                    <>
                      <input type="color" value={variant.value || '#000000'}
                        onChange={e => updateVariantValue(attr.id, variant.id, e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 dark:border-zinc-700 p-0.5 bg-white" />
                      <input type="text" value={variant.value}
                        onChange={e => updateVariantValue(attr.id, variant.id, e.target.value)}
                        placeholder="#FF0000"
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 outline-none
                          ${errors[`variant_${variant.id}`] ? 'border-rose-400' : 'border-gray-200 dark:border-zinc-700 focus:border-purple-400'}`} />
                    </>
                  ) : attr.type === ATTRIBUTE_TYPES.COLOR && attr.displayMode === 'image' ? (
                    variant.value ? (
                      <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg">
                        <img src={variant.value} alt="" className="w-9 h-9 object-cover rounded-lg" />
                        <span className="flex-1 text-xs text-gray-400 truncate">{t('Image.selected')}</span>
                        <button type="button" onClick={() => openImageSelectorForVariant(attr.id, variant.id)}
                          className="text-xs font-semibold text-indigo-500 hover:text-indigo-600">{t('Change')}</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => openImageSelectorForVariant(attr.id, variant.id)}
                        className="flex-1 py-2.5 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-1">
                        <ImageIcon size={14} />{t('Select.Image')}
                      </button>
                    )
                  ) : (
                    <input type="text" value={variant.name}
                      onChange={e => updateVariantValue(attr.id, variant.id, e.target.value)}
                      placeholder={attr.type === ATTRIBUTE_TYPES.SIZE ? t('e.g.XL') : t('Value')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 outline-none
                        ${errors[`variant_${variant.id}`] ? 'border-rose-400' : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'}`} />
                  )}
                  <button type="button" onClick={() => removeVariant(attr.id, variant.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {errors[`attr_empty_${attr.id}`] && (
                <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle size={11} />{t('Add.at.least.one.variant')}
                </p>
              )}

              <button type="button" onClick={() => addVariant(attr.id)}
                className="w-full py-2 border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-gray-400 hover:text-indigo-500 hover:border-indigo-400 transition-all">
                <Plus size={12} className="inline mr-1" />
                {attr.type === ATTRIBUTE_TYPES.COLOR && attr.displayMode === 'color' ? t('Add.Color') :
                  attr.type === ATTRIBUTE_TYPES.COLOR && attr.displayMode === 'image' ? t('Add.Image') :
                  attr.type === ATTRIBUTE_TYPES.SIZE ? t('Add.Size') : t('Add.Value')}
              </button>
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <button type="button" onClick={() => addAttribute(ATTRIBUTE_TYPES.COLOR, t('Color'))}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-600 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-all">
            <Palette size={13} />{t('Add.Color.Attribute')}
          </button>
          <button type="button" onClick={() => addAttribute(ATTRIBUTE_TYPES.SIZE, t('Size'))}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-all">
            <Ruler size={13} />{t('Add.Size.Attribute')}
          </button>
          <button type="button" onClick={() => addAttribute(ATTRIBUTE_TYPES.TEXT, '')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-all">
            <TypeIcon size={13} />{t('Add.Custom.Attribute')}
          </button>
        </div>
      </Section>

      {/* ── SECTION 3: Variant Combinations ── */}
      {attributes.length > 0 && (
        <Section icon={Grid3x3} title={t('Variant.Details')} color="teal">

          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">{t('Auto.Generate')}</span>
            </div>
            <button type="button" onClick={generateVariantCombinations}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600 transition-all">
              <Rocket size={13} />{t('Generate.Now')}
            </button>
          </div>

          {variantDetails.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {['Price', 'Stock'].map(field => (
                <div key={field} className="flex gap-2">
                  <input type="number" id={`bulk${field}`}
                    placeholder={field === 'Price' ? '0.00' : t('e.g.100')}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-950 outline-none focus:border-indigo-400" />
                  <button type="button"
                    onClick={() => {
                      const val = document.getElementById(`bulk${field}`).value;
                      if (val) setVariantDetails(prev => prev.map(d => ({ ...d, [field.toLowerCase()]: val })));
                    }}
                    className="px-3 py-2 bg-gray-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-lg hover:opacity-80 transition-all">
                    {t('Apply')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!variantDetails.length ? (
            <p className="text-center text-sm text-gray-400 py-4">{t('No.variant.details.added.yet')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{t('Total.Combinations')}: {variantDetails.length}</span>
                <button type="button" onClick={() => setVariantDetails([])} className="text-xs text-rose-500 hover:text-rose-600 font-semibold">{t('Clear.All')}</button>
              </div>

              {variantDetails.map((detail, idx) => (
                <div key={detail.id} className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 bg-gray-50 dark:bg-zinc-950">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-full">#{idx + 1}</span>
                    <button type="button" onClick={() => removeVariantDetail(detail.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {attributes.map(attr => (
                      <div key={attr.id}>
                        <label className="text-xs text-gray-400 font-medium block mb-1">{attr.name}</label>
                        {attr.displayMode === 'image'
                          ? <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-700 bg-cover" style={{ backgroundImage: `url(${detail.name[attr.name]})` }} />
                          : (
                            <div className="relative">
                              <input readOnly value={detail.name[attr.name] || ''}
                                className="w-full px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 outline-none" />
                              {detail.name[attr.name]?.startsWith('#') && (
                                <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded ${isRtl ? 'left-2' : 'right-2'}`}
                                  style={{ backgroundColor: detail.name[attr.name] }} />
                              )}
                            </div>
                          )
                        }
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1"><Tag size={11} className="inline mr-1" />{t('Price')} *</label>
                      <div className="relative">
                        <input type="number" dir="ltr" value={detail.price} onChange={e => updateVDPrice(detail.id, e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 outline-none focus:border-teal-400 border-gray-200 dark:border-zinc-700 ${isRtl ? 'pl-12' : 'pr-12'}`} />
                        <span className={`absolute top-1/2 -translate-y-1/2 text-xs text-gray-400 ${isRtl ? 'left-3' : 'right-3'}`}>{isRtl ? 'د.ج' : 'DZD'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1"><Package size={11} className="inline mr-1" />{t('Stock.Quantity')}</label>
                      <input type="number" dir="ltr" value={detail.stock} onChange={e => updateVDStock(detail.id, e.target.value)}
                        placeholder={t('e.g.100')} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-teal-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── SECTION 4: Offers ── */}
      <Section icon={Tag} title={t('Special.Offers')} color="rose">
        {!offers.length && (
          <p className="text-center text-sm text-gray-400 py-4">{t('No.offers.added.yet')}</p>
        )}

        {offers.map((offer, idx) => (
          <div key={offer.id} className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 bg-gray-50 dark:bg-zinc-950">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-rose-500">{t('Offer')} {idx + 1}</span>
              <button type="button" onClick={() => removeOffer(offer.id)}
                className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { field: 'name', label: t('Offer.Name'), type: 'text', placeholder: t('e.g.Summer.Sale') },
                { field: 'quantity', label: t('Quantity'), type: 'text', placeholder: t('e.g.10.pcs') },
                { field: 'price', label: t('Price'), type: 'number', placeholder: '0.00' },
              ].map(f => (
                <div key={f.field}>
                  <label className="text-xs text-gray-400 font-medium block mb-1">{f.label}</label>
                  <input type={f.type} value={offer[f.field]} onChange={e => updateOffer(offer.id, f.field, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-rose-400" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="button" onClick={addOffer}
          className="w-full py-2.5 border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-400 hover:text-rose-500 hover:border-rose-400 transition-all flex items-center justify-center gap-1">
          <Plus size={14} />{t('Add.New.Offer')}
        </button>
      </Section>

      {/* ── SECTION 5: Images ── */}
      <Section icon={ImageIcon} title={t('Product.Images')} color="blue">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
          <button type="button" onClick={() => setIsOpenModelImage(true)}
            className="aspect-square flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all group">
            <Plus size={20} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
            <span className="text-[9px] font-bold text-gray-300 group-hover:text-blue-400 uppercase tracking-widest">{t('Add.Photo')}</span>
          </button>

          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800">
              <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
              {i === 0 && (
                <div className={`absolute top-1.5 ${isRtl ? 'left-1.5' : 'right-1.5'} px-1.5 py-0.5 bg-white/90 dark:bg-zinc-900/90 rounded text-[9px] font-bold text-blue-500`}>
                  {t('Primary')}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
          <Sparkles size={12} className="text-blue-400" />
          {t('Use.images.with.white.or.solid.backgrounds.and.high.resolution')}
        </p>
      </Section>

      {/* ── Bottom Save ── */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-md">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? t('Updating...') : t('Update.Product')}
        </button>
      </div>
    </div>
  );
}