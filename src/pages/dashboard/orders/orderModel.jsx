import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Loader2, MapPin, Package,
  AlertCircle, Check, ChevronDown, Save
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// ── إضافة التعريف هنا لضمان عدم حدوث خطأ ReferenceError ──
export const StatusEnum = {
  PENDING: 'pending',
  APPL1: 'appl1',
  APPL2: 'appl2',
  APPL3: 'appl3',
  CONFIRMED: 'confirmed',
  SHIPPING: 'shipping',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  DELIVERED: 'delivered',
  POSTPONED: 'postponed',
};

export default function OrderModal({ isOpen, onClose, orderId, onRefresh }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';

  const [editedOrder, setEditedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wilayasData, setWilayaData] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [offers, setOffers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const token = getAccessToken();

  /* ── 1. Fetch Wilayas ── */
  useEffect(() => {
    if (!isOpen) return;
    axios.get(`${baseURL}/shipping/get-shipping`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setWilayaData(r.data || []))
      .catch(e => console.error('wilayas:', e));
  }, [isOpen]);

  /* ── 2. Fetch Order ── */
  useEffect(() => {
    if (!isOpen || !orderId) return;
    const getOrder = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${baseURL}/orders/get-one/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const initPrice = Number(data.totalPrice || 0) - Number(data.priceShip || 0);
        setEditedOrder({ ...data, initPrice });
        if (data.productId) fetchProductData(data.productId);
      } catch (e) {
        console.error('order:', e);
      } finally {
        setLoading(false);
      }
    };
    getOrder();
  }, [isOpen, orderId]);

  useEffect(() => {
    if (editedOrder?.variantDetailId && variantOptions.length > 0) {
      handleVariantChange(editedOrder.variantDetailId);
    }
  }, [variantOptions]);

  /* ── 3. Fetch variants + offers ── */
  const fetchProductData = async (productId) => {
    try {
      const [vRes, oRes] = await Promise.all([
        axios.get(`${baseURL}/products/${productId}/variants`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/products/${productId}/offers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setVariantOptions(vRes.data || []);
      setOffers(oRes.data || []);
    } catch (e) {
      console.error('product data:', e);
    }
  };

  /* ── 4. Fetch communes on wilaya change ── */
  useEffect(() => {
    if (!editedOrder?.customerWilayaId) return;
    setCommunes([]);
    axios.get(`${baseURL}/shipping/get-communes/${editedOrder.customerWilayaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => setCommunes(r.data || []))
      .catch(e => console.error('communes:', e));
  }, [editedOrder?.customerWilayaId]);

  /* ── Handlers ── */
  const handleChange = (field, value) => setEditedOrder(prev => ({ ...prev, [field]: value }));

  const handleWilayaChange = (wilayaId) => {
    const w = wilayasData.find(x => x.id === parseInt(wilayaId));
    if (!w) return;
    const newShipPrice = editedOrder.typeShip === 'office'
      ? parseFloat(w.livraisonOfice || 0)
      : parseFloat(w.livraisonHome || 0);
    setEditedOrder(prev => ({
      ...prev,
      customerWilayaId: parseInt(wilayaId),
      customerCommuneId: null,
      customerWilaya: w,
      priceShip: newShipPrice,
      totalPrice: prev.initPrice + newShipPrice,
    }));
  };

  const handleChangeTypeShip = (typeShip) => {
    const w = wilayasData.find(x => x.id === parseInt(editedOrder.customerWilayaId));
    if (!w) { setEditedOrder(prev => ({ ...prev, typeShip })); return; }
    const newShipPrice = typeShip === 'office'
      ? parseFloat(w.livraisonOfice || 0)
      : parseFloat(w.livraisonHome || 0);
    setEditedOrder(prev => ({
      ...prev, typeShip, priceShip: newShipPrice,
      totalPrice: prev.initPrice + newShipPrice,
    }));
  };

  const handleVariantChange = (variantId) => {
    const v = variantOptions.find(x => String(x.id) === String(variantId));
    if (!v) return;
    const newInitPrice = v.price > -1 ? parseFloat(v.price || 0) : editedOrder.initPrice;
    setEditedOrder(prev => ({
      ...prev, variantDetail: v, variantDetailId: v.id,
      initPrice: newInitPrice, totalPrice: newInitPrice + parseFloat(prev.priceShip || 0),
    }));
  };

  const handleOfferChange = (offerId) => {
    if (!offerId) {
      const baseInit = parseFloat(editedOrder.variantDetail?.price || editedOrder.initPrice || 0);
      setEditedOrder(prev => ({ ...prev, offerId: null, offer: null, initPrice: baseInit, totalPrice: baseInit + parseFloat(prev.priceShip || 0) }));
      return;
    }
    const o = offers.find(x => String(x.id) === String(offerId));
    if (!o) return;
    const offerPrice = parseFloat(o.price || 0);
    setEditedOrder(prev => ({
      ...prev, offerId: o.id, offer: o, initPrice: offerPrice,
      totalPrice: offerPrice + parseFloat(prev.priceShip || 0),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      variantDetailId: editedOrder.variantDetailId,
      offerId: editedOrder.offerId,
      quantity: editedOrder.quantity,
      typeShip: editedOrder.typeShip,
      priceShip: editedOrder.priceShip,
      totalPrice: editedOrder.totalPrice,
      customerName: editedOrder.customerName,
      customerPhone: editedOrder.customerPhone,
      customerWilayaId: editedOrder.customerWilayaId,
      customerCommuneId: editedOrder.customerCommuneId,
      status: editedOrder.status,
    };
    try {
      await axios.patch(`${baseURL}/orders/${editedOrder.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh?.();
      onClose();
    } catch (e) {
      alert(t('modal.save_failed'));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* Loading state */
  if (!editedOrder) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 flex flex-col items-center gap-3 shadow-2xl">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">{t('list.loading')}</p>
      </div>
    </div>
  );

  const hasProduct = !!editedOrder.product;
  const canEdit = hasProduct;

  const statusSelectCls = (() => {
    if (!canEdit) return 'bg-gray-100 dark:bg-zinc-800 text-gray-500 cursor-not-allowed';

    const colorMap = {
      [StatusEnum.PENDING]: 'bg-amber-400 text-white',
      [StatusEnum.APPL1]: 'bg-orange-400 text-white',
      [StatusEnum.APPL2]: 'bg-orange-500 text-white',
      [StatusEnum.APPL3]: 'bg-orange-600 text-white',
      [StatusEnum.CONFIRMED]: 'bg-emerald-500 text-white',
      [StatusEnum.SHIPPING]: 'bg-cyan-500 text-white',
      [StatusEnum.RETURNED]: 'bg-rose-500 text-white',
      [StatusEnum.CANCELLED]: 'bg-purple-500 text-white',
      [StatusEnum.DELIVERED]: 'bg-emerald-600 text-white',
      [StatusEnum.POSTPONED]: 'bg-slate-500 text-white',
    };

    return colorMap[editedOrder.status] || 'bg-amber-400 text-white';
  })();

  const statusOptions = [
    { value: StatusEnum.PENDING, label: t('status.pending') },
    { value: StatusEnum.APPL1, label: t('status.appl1') },
    { value: StatusEnum.APPL2, label: t('status.appl2') },
    { value: StatusEnum.APPL3, label: t('status.appl3') },
    { value: StatusEnum.CONFIRMED, label: t('status.confirmed') },
    { value: StatusEnum.SHIPPING, label: t('status.shipping') },
    { value: StatusEnum.DELIVERED, label: t('status.delivered') },
    { value: StatusEnum.CANCELLED, label: t('status.cancelled') },
    { value: StatusEnum.RETURNED, label: t('status.returned') },
    { value: StatusEnum.POSTPONED, label: t('status.postponed') },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-2 sm:p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl h-full max-h-[95vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 z-50 flex items-center justify-center rounded-2xl">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10">
          <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            {t('modal.title', { id: orderId })}
          </h2>
          <button onClick={onClose}
            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-zinc-950/30">

          {/* Col 1: Shipping */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-black uppercase tracking-widest px-1 flex items-center gap-1.5 ${canEdit ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
              <MapPin size={12} />{t('modal.section_shipping')}
            </h3>

            {!canEdit && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4">
                <p className="text-sm text-rose-600 dark:text-rose-400 font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle size={16} />{t('modal.no_product_warning')}
                </p>
                <p className="text-xs text-rose-400 text-center mt-1">{t('modal.no_product_subtitle')}</p>
              </div>
            )}

            <div className={`bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4 ${!canEdit ? 'opacity-60' : ''}`}>
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                  {t('modal.customer_name')}
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={editedOrder.customerName || ''}
                  onChange={e => handleChange('customerName', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all dark:bg-zinc-950 dark:text-white
                    ${!canEdit ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 cursor-not-allowed' : 'border-gray-200 dark:border-zinc-700 focus:border-indigo-400'}`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                  {t('modal.customer_phone')}
                </label>
                <input
                  disabled
                  type="text"
                  dir="ltr"
                  value={editedOrder.customerPhone || ''}
                  className="w-full bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-semibold outline-none dark:text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                    {t('modal.wilaya')}
                  </label>
                  <select
                    value={editedOrder.customerWilayaId || ''}
                    onChange={e => handleWilayaChange(e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all dark:text-white
                      ${!canEdit ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 cursor-not-allowed' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 cursor-pointer focus:border-indigo-400'}`}
                  >
                    <option value="">{t('modal.select_wilaya')}</option>
                    {wilayasData.map(w => (
                      <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                    {t('modal.commune')}
                  </label>
                  <select
                    value={editedOrder.customerCommuneId || ''}
                    onChange={e => handleChange('customerCommuneId', parseInt(e.target.value))}
                    disabled={!canEdit || !communes.length}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all dark:text-white
                      ${!canEdit ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 cursor-not-allowed' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 cursor-pointer focus:border-indigo-400 disabled:bg-gray-100 dark:disabled:bg-zinc-800'}`}
                  >
                    <option value="">{t('modal.select_commune')}</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{c.ar_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                  {t('modal.ship_type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { typeShip: 'home', label: t('modal.ship_home') },
                    { typeShip: 'office', label: t('modal.ship_office') },
                  ].map(opt => (
                    <button key={opt.typeShip} type="button"
                      onClick={() => handleChangeTypeShip(opt.typeShip)}
                      disabled={!canEdit}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all
                        ${!canEdit ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400 cursor-not-allowed' :
                          editedOrder.typeShip === opt.typeShip
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                  {t('modal.status_label')}
                </label>
                <select
                  value={editedOrder.status}
                  onChange={e => handleChange('status', e.target.value)}
                  disabled={!canEdit}
                  className={`w-full px-4 py-2 rounded-xl text-xs font-black outline-none border-none cursor-pointer transition-all ${statusSelectCls}`}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-black uppercase tracking-widest px-1 flex items-center gap-1.5 ${hasProduct ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
              <Package size={12} />{t('modal.section_product')}
            </h3>

            {hasProduct ? (
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                    {t('modal.product_label')}
                  </label>
                  <div className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    {editedOrder.product?.name || editedOrder.productName || t('modal.product_unknown')}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                    {t('modal.quantity')}
                  </label>
                  <input
                    type="number" min="1"
                    value={editedOrder.quantity || 1}
                    onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white text-sm font-black text-center outline-none focus:border-indigo-400 transition-all"
                  />
                </div>

                {variantOptions.length > 0 && (
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                      {t('modal.variant_label')}
                    </label>

                    <button type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/30 dark:bg-purple-500/5 text-sm font-semibold outline-none focus:border-purple-400 transition-all dark:text-white">
                      <div className="flex items-center gap-2">
                        {editedOrder.variantDetail ? (
                          <>
                            {Array.isArray(editedOrder.variantDetail.name) && editedOrder.variantDetail.name.map((attr, i) => (
                              <div key={i}>
                                {attr.displayMode === 'color' && (
                                  <span className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm block" style={{ background: attr.value }} />
                                )}
                                {attr.displayMode === 'image' && (
                                  <img src={attr.value} className="w-7 h-7 rounded-lg object-cover shadow-sm border border-white dark:border-zinc-800" alt="" />
                                )}
                              </div>
                            ))}
                            <span>
                              {Array.isArray(editedOrder.variantDetail.name)
                                ? editedOrder.variantDetail.name.filter(a => a.displayMode !== 'color' && a.displayMode !== 'image').map(a => a.value).join(' / ')
                                : ''}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 dark:text-zinc-500">{t('modal.variant_placeholder')}</span>
                        )}
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1">
                        {variantOptions.map(v => {
                          const attrs = Array.isArray(v.name) ? v.name : [];
                          const textLabel = attrs.filter(a => a.displayMode !== 'color' && a.displayMode !== 'image').map(a => a.value).join(' / ');
                          const isSelected = String(editedOrder.variantDetailId) === String(v.id);
                          return (
                            <div key={v.id}
                              onClick={() => { handleVariantChange(v.id); setIsDropdownOpen(false); }}
                              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-500/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-1.5">
                                  {attrs.map((attr, idx) => (
                                    <div key={idx}>
                                      {attr.displayMode === 'color' && (
                                        <div className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm" style={{ backgroundColor: attr.value }} />
                                      )}
                                      {attr.displayMode === 'image' && (
                                        <img src={attr.value} className="w-6 h-6 rounded-md border-2 border-white dark:border-zinc-900 shadow-sm object-cover" alt="" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2">
                                  {textLabel && (
                                    <span className="text-sm font-bold border border-gray-200 dark:border-zinc-700 px-2 py-0.5 rounded-lg text-gray-700 dark:text-zinc-300">
                                      {textLabel}
                                    </span>
                                  )}
                                  {v.price > 0 && (
                                    <span className="text-[10px] text-purple-500 dark:text-purple-400 font-bold">
                                      {parseFloat(v.price).toLocaleString()} DA
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {offers.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wide">
                      {t('modal.offer_label')}
                    </label>
                    <select
                      value={editedOrder.offerId || ''}
                      onChange={e => handleOfferChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-orange-200 dark:border-orange-500/30 bg-orange-50/30 dark:bg-orange-500/5 text-sm outline-none cursor-pointer focus:border-orange-400 dark:text-white transition-all">
                      <option value="">{t('modal.offer_none')}</option>
                      {offers.map(o => (
                        <option key={o.id} value={o.id}>{o.name} — {parseFloat(o.price).toLocaleString()} DA</option>
                      ))}
                    </select>
                  </div>
                )}

                <PriceSummary
                  priceLabel={t('modal.price_product')}
                  initPrice={editedOrder.initPrice}
                  priceShip={editedOrder.priceShip}
                  totalPrice={editedOrder.totalPrice}
                  t={t}
                />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-zinc-800/30 p-6 rounded-2xl border border-gray-200 dark:border-zinc-700 space-y-4">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package size={28} className="text-gray-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-600 dark:text-zinc-300 mb-1">{t('modal.no_product_title')}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2">{t('modal.no_product_desc')}</p>
                  <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-zinc-700 px-3 py-1.5 rounded-lg inline-block">
                    {t('modal.no_product_note')}
                  </span>
                </div>
                <PriceSummary
                  priceLabel={t('modal.price_original')}
                  initPrice={editedOrder.initPrice}
                  priceShip={editedOrder.priceShip}
                  totalPrice={editedOrder.totalPrice}
                  t={t}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex justify-end items-center gap-3 z-10">
          <button onClick={onClose}
            className="px-5 py-2.5 text-gray-400 dark:text-zinc-500 font-semibold text-sm hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
            {t('modal.close')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !canEdit}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50
              ${canEdit
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 cursor-not-allowed'}`}>
            {loading
              ? <><Loader2 size={16} className="animate-spin" />{t('modal.saving')}</>
              : <><Save size={15} />{t('modal.save')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceSummary({ priceLabel, initPrice, priceShip, totalPrice, t }) {
  return (
    <div className="p-4 bg-gray-900 dark:bg-zinc-950 rounded-2xl space-y-2 border border-zinc-800">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{priceLabel}</span>
        <span>{parseFloat(initPrice || 0).toLocaleString()} DA</span>
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{t('modal.price_ship')}</span>
        <span>{parseFloat(priceShip || 0).toLocaleString()} DA</span>
      </div>
      <div className="border-t border-zinc-700 pt-2 flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400">{t('modal.price_total')}</span>
        <span className="text-emerald-400 text-xl font-black">{parseFloat(totalPrice || 0).toLocaleString()} DA</span>
      </div>
    </div>
  );
}