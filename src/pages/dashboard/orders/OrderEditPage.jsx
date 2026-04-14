import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, MapPin, AlertCircle, Save, Package,
  ChevronDown, CheckCircle2, ShoppingBag, Trash2
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { Plus } from 'lucide-react';
import { X } from 'lucide-react';
import { Search } from 'lucide-react';

export const StatusEnum = {
  PENDING: 'pending', APPL1: 'appl1', APPL2: 'appl2', APPL3: 'appl3',
  CONFIRMED: 'confirmed', SHIPPING: 'shipping', CANCELLED: 'cancelled',
  RETURNED: 'returned', DELIVERED: 'delivered', POSTPONED: 'postponed',
};

const STATUS_META = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'معلق' },
  appl1: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'محاولة 1' },
  appl2: { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'محاولة 2' },
  appl3: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'محاولة 3' },
  confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'مؤكد' },
  shipping: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', label: 'في الشحن' },
  delivered: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'تم التوصيل' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'ملغى' },
  returned: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'مسترجع' },
  postponed: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', label: 'مؤجل' },
};

export default function OrderEditPage() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';
  const { id } = useParams();
  const cartId = id

  console.log(cartId);

  const navigate = useNavigate();

  const [editedCart, setEditedCart] = useState(null);
  const [originalCart, setOriginalCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wilayasData, setWilayaData] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [productOptions, setProductOptions] = useState({});
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState(null);

  const [addItems, setItems] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat(isRtl ? 'ar-DZ' : 'en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSelectProduct = async (product) => {
    const price = parseFloat(product.price || 0);

    // إنشاء عنصر جديد بهيكل البيانات المتوقع في السلة
    const newItem = {
      id: `new-${Date.now()}`, // توليد معرف فريد مؤقت للعنصر الجديد
      productId: product.id,
      product: {
        ...product,
        imagesProduct: [{ imageUrl: product.image }] // مطابقة هيكل البيانات للصور
      },
      quantity: 1,
      initPrice: price,
      finalPrice: price,
      itemTotal: price,
      variantDetailId: null,
      offerId: null
    };

    // إضافة المنتج الجديد إلى مصفوفة العناصر الحالية
    setEditedCart(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));

    // جلب خيارات المتغيرات والعروض للمنتج الجديد فور إضافته
    await fetchProductOptions([newItem]);

    setIsProductModalOpen(false);
    setSearchQuery(''); // تنظيف البحث للمرة القادمة
  };



  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');

  useEffect(() => {
    const getProduct = async () => {
      try {
        const response = await axios.get(`${baseURL}/stores/${storeId}/products`, {
          headers: { Authorization: `bearer ${token}` }
        });
        const listProduct = response.data.products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.imagesProduct[0]?.imageUrl
        }));
        setProducts(listProduct);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    if (storeId) getProduct();
  }, [storeId, token]);

  useEffect(() => {
    axios.get(`${baseURL}/shipping/get-shipping`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => setWilayaData(r.data || []))
      .catch(e => console.error('Failed to load wilayas:', e));
  }, [token]);


  const fetchOrderData = useCallback(async () => {
    if (!cartId) return;
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(`${baseURL}/orders/get-one/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(data);

      const cartData = Array.isArray(data) ? data[0] : data;

      const initialCart = {
        ...cartData,
        customerWilayaId: cartData.customerWilayaId ?? cartData.customerWilaya?.id,
        customerCommuneId: cartData.customerCommuneId ?? cartData.customerCommune?.id,
        priceShip: parseFloat(cartData.priceShip || 0),
        typeShip: cartData.typeShip || 'home',
        status: cartData.status || cartData.items?.[0]?.status || 'pending',
        items: (cartData.items || []).map(item => {
          const baseTotal = Number(item.totalPrice || 0) - Number(item.priceShip || 0);
          const initPrice = item.quantity > 0 ? baseTotal / item.quantity : baseTotal;
          return {
            ...item,
            initPrice,
            itemTotal: baseTotal,
            finalPrice: item.finalPrice || item.product?.price || 0
          };
        })
      };

      setEditedCart(initialCart);
      setOriginalCart(JSON.parse(JSON.stringify(initialCart)));

      if (initialCart.customerWilaya?.id) {
        fetchCommunes(initialCart.customerWilaya.id);
      }

      await fetchProductOptions(cartData.items || []);

    } catch (e) {
      console.error('Failed to load order:', e);
      setError(t('edit.load_error') || 'فشل تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  }, [cartId, token, t]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  useEffect(() => {
    if (!editedCart || !originalCart) return;
    setHasChanges(JSON.stringify(editedCart) !== JSON.stringify(originalCart));
  }, [editedCart, originalCart]);

  const fetchCommunes = async (wilayaId) => {
    if (!wilayaId) return;
    try {
      const { data } = await axios.get(
        `${baseURL}/shipping/get-communes/${wilayaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(data);

      setCommunes(data || []);
    } catch (e) {
      console.error('Failed to load communes:', e);
      setCommunes([]);
    }
  };

  const fetchProductOptions = async (items) => {
    const ids = [...new Set(items.map(i => i.productId).filter(Boolean))];
    if (ids.length === 0) return;

    const opts = { ...productOptions };

    await Promise.all(ids.map(async pid => {
      if (!opts[pid]) {
        try {
          const [vR, oR] = await Promise.all([
            axios.get(`${baseURL}/products/${pid}/variants`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${baseURL}/products/${pid}/offers`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
          ]);
          opts[pid] = { variants: vR.data || [], offers: oR.data || [] };
        } catch (e) {
          console.error(`Failed to load options for product ${pid}:`, e);
          opts[pid] = { variants: [], offers: [] };
        }
      }
    }));

    setProductOptions(opts);
  };

  const handleGeneralChange = (field, value) => {
    setEditedCart(prev => ({ ...prev, [field]: value }));
    if (field === 'customerWilayaId') fetchCommunes(value);
  };

  const handleWilayaChange = (wilayaId) => {
    const w = wilayasData.find(x => x.id === parseInt(wilayaId));
    if (!w) return;

    const priceShip = editedCart.typeShip === 'office'
      ? parseFloat(w.livraisonOfice || 0)
      : parseFloat(w.livraisonHome || 0);

    setEditedCart(prev => ({
      ...prev,
      customerWilayaId: parseInt(wilayaId),
      customerCommuneId: null,
      customerWilaya: w,
      priceShip,
    }));

    fetchCommunes(wilayaId);
  };

  const handleChangeTypeShip = (typeShip) => {
    const w = wilayasData.find(x => x.id === parseInt(editedCart.customerWilayaId));
    if (!w) {
      handleGeneralChange('typeShip', typeShip);
      return;
    }

    const priceShip = typeShip === 'office'
      ? parseFloat(w.livraisonOfice || 0)
      : parseFloat(w.livraisonHome || 0);

    setEditedCart(prev => ({ ...prev, typeShip, priceShip }));
  };

  const handleItemChange = (itemId, field, value) => {
    setEditedCart(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;

        let updatedItem = { ...item, [field]: value };

        if (field === 'variantDetailId') {
          const v = productOptions[item.productId]?.variants.find(
            x => String(x.id) === String(value)
          );
          if (v && v.price > -1) updatedItem.finalPrice = parseFloat(v.price);
          updatedItem.variantDetail = v;
        }

        if (field === 'offerId') {
          const o = productOptions[item.productId]?.offers.find(
            x => String(x.id) === String(value)
          );
          if (o) {
            updatedItem.finalPrice = parseFloat(o.price);
            updatedItem.offer = o;
          } else {
            const basePrice = updatedItem.variantDetail?.price > -1
              ? updatedItem.variantDetail.price
              : updatedItem.product?.price || 0;
            updatedItem.finalPrice = parseFloat(basePrice);
            updatedItem.offer = null;
          }
        }

        updatedItem.itemTotal = updatedItem.finalPrice * updatedItem.quantity;
        return updatedItem;
      })
    }));
  };

  const handleDeleteItem = (itemId) => {
    if (editedCart.items.length <= 1) {
      alert(t('edit.cannot_delete_last_item') || 'لا يمكن حذف آخر منتج في الطلب');
      return;
    }

    if (window.confirm(t('edit.confirm_delete_item') || 'هل أنت متأكد من حذف هذا المنتج؟')) {
      // 1. حساب القائمة الجديدة
      const updatedItems = editedCart.items.filter(item => item.id !== itemId);

      // 2. تحديث الواجهة
      setEditedCart(prev => ({
        ...prev,
        items: updatedItems
      }));

      // 3. إرسال القائمة الجديدة فوراً للباك إند
      handleSave(true, updatedItems);
    }
  };

  const calculateTotals = () => {
    if (!editedCart) return { items: 0, shipping: 0, total: 0 };
    const itemsTotal = editedCart.items.reduce((s, it) => s + (it.finalPrice * it.quantity), 0);
    return {
      items: itemsTotal,
      shipping: parseFloat(editedCart.priceShip || 0),
      total: itemsTotal + parseFloat(editedCart.priceShip || 0)
    };
  };

  const handleSave = async (isDelete = false, itemsOverride = null) => {
    // استخدام القائمة الممررة (في حال الحذف) أو القائمة الحالية في الـ state
    const itemsToSave = itemsOverride || editedCart.items;

    !isDelete && setSaving(true);
    try {
      const dtos = itemsToSave.map((item) => ({
        customerName: editedCart.customerName,
        customerPhone: editedCart.customerPhone,
        customerWilayaId: editedCart.customerWilayaId,
        customerCommuneId: editedCart.customerCommuneId,
        status: editedCart.status,
        typeShip: editedCart.typeShip,
        priceShip: editedCart.priceShip,

        productId: item.productId,
        quantity: item.quantity,
        variantDetailId: item.variantDetailId || null,
        offerId: item.offerId || null,
        finalPrice: item.finalPrice,
      }));

      await axios.patch(`${baseURL}/orders/${editedCart.id}`, dtos, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // تحديث الحالة المرجعية للمقارنة لاحقاً
      const newCartState = { ...editedCart, items: itemsToSave };
      setOriginalCart(JSON.parse(JSON.stringify(newCartState)));
      setHasChanges(false);

      if (!isDelete) {
        alert(t('edit.save_success') || 'تم حفظ التغييرات بنجاح');
      }
    } catch (e) {
      console.error("Save Error:", e);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm(t('edit.unsaved_changes') || 'لديك تغييرات غير محفوظة. هل تريد المغادرة؟')) {
        navigate('/dashboard/orders');
      }
    } else {
      navigate('/dashboard/orders');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
          <p className="text-gray-500 dark:text-zinc-400">{t('edit.loading') || 'جاري التحميل...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg border border-red-200 dark:border-red-900/30 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('edit.error_title') || 'خطأ'}</h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchOrderData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">إعادة المحاولة</button>
            <button onClick={() => navigate('/dashboard/orders')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">رجوع</button>
          </div>
        </div>
      </div>
    );
  }

  if (!editedCart) return null;

  const totals = calculateTotals();
  const statusMeta = STATUS_META[editedCart.status] || STATUS_META.pending;
  const shortId = (editedCart.cartId || editedCart.id || '').split('-')[0].toUpperCase();

  return (
    <div className='md:pb-20 '>
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* بيانات الزبون */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-500" />
                    <h2 className="font-bold text-gray-900 dark:text-white">بيانات الزبون والتوصيل</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">اسم الزبون</label>
                      <input type="text" value={editedCart.customerName || ''} onChange={e => handleGeneralChange('customerName', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">رقم الهاتف</label>
                      <input type="tel" dir="ltr" value={editedCart.customerPhone || ''} onChange={e => handleGeneralChange('customerPhone', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:border-indigo-500 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">الولاية</label>
                      <select value={editedCart.customerWilayaId || ''} onChange={e => handleWilayaChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:border-indigo-500 outline-none">
                        <option value="">اختر الولاية</option>
                        {wilayasData.map(w => <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">البلدية</label>
                      <select value={editedCart.customerCommuneId || ''} onChange={e => handleGeneralChange('customerCommuneId', parseInt(e.target.value))} disabled={!communes.length} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:border-indigo-500 outline-none disabled:opacity-50">
                        <option value="">اختر البلدية</option>
                        {communes.map(c => <option key={c.id} value={c.id}>{c.ar_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">نوع التوصيل</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ key: 'home', label: 'المنزل', icon: '🏠' }, { key: 'office', label: 'المكتب', icon: '🏢' }].map(o => (
                          <button key={o.key} onClick={() => handleChangeTypeShip(o.key)} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${editedCart.typeShip === o.key ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                            <span>{o.icon}</span>{o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">حالة الطلب</label>
                      <select value={editedCart.status} onChange={e => handleGeneralChange('status', e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 font-semibold text-sm outline-none" style={{ borderColor: `${statusMeta.color}40`, color: statusMeta.color, backgroundColor: statusMeta.bg }}>
                        {Object.entries(StatusEnum).map(([key, value]) => <option key={value} value={value}>{STATUS_META[value]?.label || value}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* المنتجات */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-indigo-500" />
                    <h2 className="font-bold text-gray-900 dark:text-white">المنتجات</h2>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">{editedCart.items.length}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {editedCart.items.map((item, idx) => {
                    const pOpts = productOptions[item.productId] || { variants: [], offers: [] };
                    const isDropOpen = dropdownOpenId === item.id;
                    const variantText = Array.isArray(item.variantDetail?.name) ? item.variantDetail.name.filter(a => a.displayMode !== 'color' && a.displayMode !== 'image').map(a => a.value).join(' / ') : '';
                    const variantVisuals = Array.isArray(item.variantDetail?.name) ? item.variantDetail.name.filter(a => a.displayMode === 'color' || a.displayMode === 'image') : [];

                    return (
                      <div key={item.id} className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">

                        {/* الجزء العلوي: الصورة، الاسم وزر الحذف */}
                        <div className="flex gap-4 mb-5">
                          <div className="relative w-15 h-15 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200/50">
                            <img
                              src={item.product?.imagesProduct[0].imageUrl}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div className="flex justify-between items-center">
                              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm leading-tight line-clamp-2">
                                {item.product?.name || item.productName || 'منتج غير معروف'}
                              </h3>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                {parseFloat(item.finalPrice || 0).toLocaleString()} <small className="text-[10px] font-bold">DA</small>
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-400 line-through">
                                  {parseFloat(item.itemTotal || 0).toLocaleString()} DA
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* أدوات التحكم: الكمية، العرض، والمتغير */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {/* حقل الكمية بتصميم أنظف */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">الكمية</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity || 1}
                                  onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-full bg-gray-50 dark:bg-zinc-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                              </div>
                            </div>

                            {/* اختيار العرض */}
                            {pOpts.offers.length > 0 && (
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">العرض الترويجي</label>
                                <select
                                  value={item.offerId || ''}
                                  onChange={e => handleItemChange(item.id, 'offerId', e.target.value)}
                                  className="w-full bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl px-2 py-2.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 focus:ring-2 focus:ring-amber-500/20 outline-none appearance-none"
                                >
                                  <option value="">بدون عرض</option>
                                  {pOpts.offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* اختيار المتغير (Variant) */}
                          {pOpts.variants.length > 0 && (
                            <div className="relative space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">المتغير المختار</label>
                              <button
                                onClick={() => setDropdownOpenId(isDropOpen ? null : item.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isDropOpen
                                  ? 'border-indigo-500 bg-white dark:bg-zinc-800 shadow-sm'
                                  : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex -space-x-1.5">
                                    {variantVisuals.map((a, i) => (
                                      <div key={i} className="ring-2 ring-white dark:ring-zinc-900 rounded-full overflow-hidden">
                                        {a.displayMode === 'color'
                                          ? <span className="w-4 h-4 block" style={{ background: a.value }} />
                                          : <img src={a.value} className="w-4 h-4 object-cover" alt="" />
                                        }
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                    {variantText || 'تخصيص المنتج'}
                                  </span>
                                </div>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isDropOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                              </button>

                              {/* القائمة المنسدلة */}
                              {isDropOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div className="max-h-60 overflow-y-auto p-1.5">
                                    {pOpts.variants.map(v => {
                                      const attrs = Array.isArray(v.name) ? v.name : [];
                                      const txt = attrs.filter(a => a.displayMode !== 'color' && a.displayMode !== 'image').map(a => a.value).join(' / ');
                                      const sel = String(item.variantDetailId) === String(v.id);
                                      return (
                                        <div
                                          key={v.id}
                                          onClick={() => { handleItemChange(item.id, 'variantDetailId', v.id); setDropdownOpenId(null); }}
                                          className={`flex items-center justify-between px-3 py-3 mb-1 last:mb-0 rounded-lg cursor-pointer transition-colors ${sel ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'hover:bg-gray-50 dark:hover:bg-zinc-700/50 text-gray-700 dark:text-zinc-300'
                                            }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                              {attrs.map((a, i) => (
                                                <div key={i} className="rounded-full border border-gray-200 dark:border-zinc-600 overflow-hidden">
                                                  {a.displayMode === 'color'
                                                    ? <span className="w-3 h-3 block" style={{ background: a.value }} />
                                                    : <img src={a.value} className="w-3 h-3 object-cover" alt="" />
                                                  }
                                                </div>
                                              ))}
                                            </div>
                                            <span className="text-xs font-medium">{txt}</span>
                                          </div>
                                          {sel && <CheckCircle2 size={16} className="text-indigo-500" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}


                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })}

                  <button
                    onClick={() => setIsProductModalOpen(true)}
                    className="group relative w-full h-40 bg-white dark:bg-zinc-900/40 border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-4 active:scale-[0.98] overflow-hidden"
                  >
                    {/* حاوية الأيقونة المركزية */}
                    <div className="relative">
                      {/* تم تغيير bg-white إلى bg-amber-50 لزيادة التباين مع الأيقونة */}
                      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-400/10 border-2 border-dashed border-amber-400 rounded-full flex items-center justify-center transition-all duration-500 group-hover:rotate-90 group-hover:scale-110 group-hover:border-solid group-hover:bg-amber-400">
                        <Plus size={32} className="text-amber-500 transition-colors duration-300 group-hover:text-white" />
                      </div>

                      {/* تأثير النبض الضوئي خلف الأيقونة */}
                      <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-0 group-hover:opacity-20" />
                    </div>

                    <div className="text-center z-10">
                      <span className="block text-sm font-black text-gray-900 dark:text-zinc-100 uppercase tracking-wide">
                        إضافة منتج جديد
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-1 block">
                        تصفح القائمة وإضافة عناصر للسلة
                      </span>
                    </div>

                    {/* خلفية جمالية عند التحويم (Gradient Shine) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>

            {/* الملخص */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50">
                    <h2 className="font-bold text-gray-900 dark:text-white">ملخص الطلبية</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">عدد المنتجات</span><span className="font-semibold">{editedCart.items.length}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">مجموع المنتجات</span><span className="font-semibold">{parseFloat(totals.items).toLocaleString()} DA</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">تكلفة الشحن</span><span className="font-semibold">{parseFloat(totals.shipping).toLocaleString()} DA</span></div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex justify-between"><span className="text-sm font-bold uppercase">الإجمالي</span><span className="text-2xl font-black text-emerald-600">{parseFloat(totals.total).toLocaleString()} DA</span></div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><Package size={14} className="text-indigo-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-900">رقم الطلب</p>
                      <p className="text-xs text-indigo-600/70 font-mono">{editedCart.id}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 mt-10">

                  <button onClick={handleSave} disabled={saving || !hasChanges} className="flex w-full justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg">
                    {saving ? <><Loader2 size={16} className="animate-spin" /> جاري الحفظ...</> : <><Save size={16} /> حفظ التغييرات</>}
                  </button>
                  {hasChanges && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      تغييرات غير محفوظة
                    </span>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('select_product_title') || 'Products'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder') || 'Search...'}
                  className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-200"
                    >
                      <img src={product.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 break-words max-w-full">
                          {product.name}
                        </h3>                        <p className="text-sm text-indigo-600">{formatPrice(product.price)}</p>
                      </div>
                      {selectedProduct?.id === product.id && <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('no_products') || 'No products found'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}