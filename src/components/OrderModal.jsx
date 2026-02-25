import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  X, Trash2, Truck, MapPin, Edit3, Save,
  ChevronDown, Upload, CheckCheck,
  Home, Building2, Lock, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  StatusPill, PlatformBadge, StatusDropdown,
  FieldLabel, ReadonlyField, LockBanner, VariantDisplay, SearchableSelect,
  TypeShipEnum, typeShipOptions, statusOptions,
  getStatus, getInitials, isLocked, fmtDate, mapApiOrder,
} from './OrderShared';

// ─── Config ───────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';
const SHIP_ID      = 'd9e3008a-769d-4a87-87fe-91dc39e97726';

const ORDER_URL    = (id) => `${API_BASE_URL}/orders/get-one/${id}`;
const WILAYAS_URL  =         `${API_BASE_URL}/shipping/get-shipping/${SHIP_ID}`;
const COMMUNES_URL = (id) => `${API_BASE_URL}/shipping/get-communes/${id}`;
const VARIANTS_URL = (id) => `${API_BASE_URL}/products/${id}/variants`;
const OFFERS_URL   = (id) => `${API_BASE_URL}/products/${id}/offers`;

// ─── OrderModal ───────────────────────────────────────────────────
// Props:
//   orderId   — string UUID, required. null/undefined = modal hidden
//   onClose   — () => void
//   onRefresh — () => void  called after save / delete / status-change
export default function OrderModal({ orderId, onClose, onRefresh }) {
  if (!orderId) return null;

  // ── Order ──
  const [order, setOrder]       = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── UI ──
  const [isEditing, setIsEditing]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // ── Dropdown data ──
  const [wilayas, setWilayas]                 = useState([]);
  const [communes, setCommunes]               = useState([]);
  const [variants, setVariants]               = useState([]);
  const [offers, setOffers]                   = useState([]);
  const [loadingWilayas, setLoadingWilayas]   = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingOffers, setLoadingOffers]     = useState(false);

  // ── Fetch order by id ──
  const fetchOrder = useCallback(async () => {
    setFetching(true); setFetchError(null);
    try {
      const { data } = await axios.get(ORDER_URL(orderId));
      const mapped = mapApiOrder(data);
      setOrder(mapped);
      setEditForm({ ...mapped });
    } catch (err) {
      console.error(err);
      setFetchError('تعذّر تحميل بيانات الطلب');
    } finally { setFetching(false); }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ── Fetch dropdowns when edit opens ──
  const fetchWilayas = useCallback(async () => {
    if (wilayas.length > 0) return;
    setLoadingWilayas(true);
    try {
      const { data } = await axios.get(WILAYAS_URL);
      setWilayas(Array.isArray(data) ? data : (data.data ?? []));
    } catch { toast.error('تعذّر تحميل قائمة الولايات'); }
    finally { setLoadingWilayas(false); }
  }, [wilayas.length]);

  const fetchCommunes = useCallback(async (wilayaId) => {
    if (!wilayaId) return;
    setLoadingCommunes(true); setCommunes([]);
    try {
      const { data } = await axios.get(COMMUNES_URL(wilayaId));
      setCommunes(Array.isArray(data) ? data : (data.data ?? []));
    } catch { toast.error('تعذّر تحميل قائمة البلديات'); }
    finally { setLoadingCommunes(false); }
  }, []);

  const fetchVariants = useCallback(async (productId) => {
    if (!productId) return;
    setLoadingVariants(true); setVariants([]);
    try {
      const { data } = await axios.get(VARIANTS_URL(productId));
      setVariants(Array.isArray(data) ? data : (data.data ?? data.variants ?? []));
    } catch { toast.error('تعذّر تحميل متغيرات المنتج'); }
    finally { setLoadingVariants(false); }
  }, []);

  const fetchOffers = useCallback(async (productId) => {
    if (!productId) return;
    setLoadingOffers(true); setOffers([]);
    try {
      const { data } = await axios.get(OFFERS_URL(productId));
      setOffers(Array.isArray(data) ? data : (data.data ?? data.offers ?? []));
    } catch { toast.error('تعذّر تحميل عروض المنتج'); }
    finally { setLoadingOffers(false); }
  }, []);

  useEffect(() => {
    if (isEditing && editForm) {
      fetchWilayas();
      if (editForm.wilayaId)  fetchCommunes(editForm.wilayaId);
      if (editForm.productId) fetchVariants(editForm.productId);
      if (editForm.productId) fetchOffers(editForm.productId);
    }
  }, [isEditing]); // eslint-disable-line

  // ── Shipping recalc helper ──
  const recalcShipping = (wilayaObj, typeShip, unityPrice) => {
    if (!wilayaObj) return {};
    const ship = typeShip === TypeShipEnum.HOME
      ? parseFloat(wilayaObj.livraisonHome  || 0)
      : parseFloat(wilayaObj.livraisonOfice || 0);
    return { priceShip: ship, totalPrice: (parseFloat(unityPrice) || 0) + ship };
  };

  const set = (field) => (val) => setEditForm(f => ({ ...f, [field]: val }));

  // ── Derived flags ──
  const orderLocked = editForm ? isLocked(editForm.status) : false;
  const canEdit     = isEditing && !orderLocked;
  const canUpload   = editForm?.status === 'confirmed' && !editForm?.isUploadedShipping;
  const isShipping  = editForm?.status === 'shipping';
  const isDelivered = editForm?.status === 'delivered';

  // ── Handlers ──
  const handleStatusChange = async (newStatus) => {
    const prev = editForm.status;
    setEditForm(f => ({ ...f, status: newStatus }));
    setSavingStatus(true);
    try {
      await axios.patch(`${API_BASE_URL}/orders/${orderId}`, { status: newStatus });
      toast.success(`تم تغيير الحالة إلى «${getStatus(newStatus).label}»`);
      await fetchOrder();
      onRefresh?.();
    } catch (err) {
      setEditForm(f => ({ ...f, status: prev }));
      toast.error('فشل تغيير الحالة — حاول مجدداً');
      console.error(err);
    } finally { setSavingStatus(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API_BASE_URL}/orders/${orderId}`, {
        customerName:      editForm.name,
        customerPhone:     editForm.phone,
        customerWilayaId:  editForm.wilayaId,
        customerCommuneId: editForm.communeId,
        typeShip:          editForm.typeShip,
        priceShip:         editForm.priceShip,
        totalPrice:        editForm.totalPrice,
        unityPrice:        editForm.unityPrice,
        quantity:          editForm.quantity,
        status:            editForm.status,
        variantDetailId:   editForm.variantDetailId,
        offerId:           editForm.offerId,
      });
      toast.success('تم حفظ التغييرات بنجاح');
      await fetchOrder();
      setIsEditing(false);
      onRefresh?.();
    } catch (err) {
      toast.error('فشل حفظ التغييرات — حاول مجدداً');
      console.error(err);
    } finally { setSaving(false); }
  };

  const handleUploadShipping = async () => {
    await handleStatusChange('shipping');
    try { await axios.post(`${API_BASE_URL}/orders/${orderId}/upload-shipping`); }
    catch { /* non-critical */ }
    setEditForm(f => ({ ...f, isUploadedShipping: true }));
    toast.success('تم رفع الطلب إلى شركة الشحن');
  };

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
      toast.success('تم حذف الطلب');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error('فشل حذف الطلب');
      console.error(err);
    }
  };

  const handleEditClick = () => {
    if (orderLocked) { toast.warning('بيانات الطلب مقفلة — يمكنك فقط تغيير الحالة'); return; }
    setIsEditing(true);
  };

  const handleDiscard = () => { setEditForm({ ...order }); setIsEditing(false); };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div onClick={onClose} className="fixed inset-0 bg-gray-900/50 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[560px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ height: 'min(820px, 92vh)' }}
      >

        {/* ══ Header ══ */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex-shrink-0">
          {/* Left: avatar + title */}
          {fetching || !editForm ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="w-28 h-3 bg-gray-100 dark:bg-zinc-800 rounded" />
                <div className="w-20 h-2.5 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[12px] font-black text-white flex-shrink-0 shadow-md">
                {getInitials(editForm.name || '?')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-black text-gray-900 dark:text-white">
                    {isEditing ? 'تعديل الطلب' : 'تفاصيل الطلب'}
                  </p>
                  {orderLocked && !isEditing && <Lock size={13} className="text-gray-400 dark:text-zinc-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">#{orderId.slice(0, 8)}</span>
                  <StatusPill status={editForm.status} />
                </div>
              </div>
            </div>
          )}

          {/* Right: refresh + close */}
          <div className="flex items-center gap-1">
            {!fetching && !isEditing && (
              <button onClick={fetchOrder} title="تحديث" className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all">
                <RefreshCw size={15} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ══ Body ══ */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Loading skeleton */}
          {fetching && (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-xl" />)}
              </div>
              <div className="h-px bg-gray-100 dark:bg-zinc-800" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="w-20 h-2.5 bg-gray-100 dark:bg-zinc-800 rounded" />
                  <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!fetching && fetchError && (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <AlertCircle size={36} className="text-rose-500" />
              <p className="text-sm font-bold text-rose-500">{fetchError}</p>
              <button onClick={fetchOrder} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold">
                <RefreshCw size={14} /> إعادة المحاولة
              </button>
            </div>
          )}

          {/* Content */}
          {!fetching && !fetchError && editForm && (
            <div className="space-y-4">

              {orderLocked && <LockBanner status={editForm.status} />}

              {/* Timestamps */}
              {(editForm.createdAt || editForm.confirmedAt || editForm.shippingAt || editForm.deliveredAt) && (
                <div className="grid grid-cols-2 gap-2">
                  {editForm.createdAt && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">تاريخ الإنشاء</p>
                      <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-300">{fmtDate(editForm.createdAt)}</p>
                    </div>
                  )}
                  {editForm.confirmedAt && (
                    <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/15 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider mb-0.5">تاريخ التأكيد</p>
                      <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{fmtDate(editForm.confirmedAt)}</p>
                    </div>
                  )}
                  {editForm.shippingAt && (
                    <div className="bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-500/15 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] font-black text-cyan-400 uppercase tracking-wider mb-0.5">تاريخ الشحن</p>
                      <p className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">{fmtDate(editForm.shippingAt)}</p>
                    </div>
                  )}
                  {editForm.deliveredAt && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">تاريخ التوصيل</p>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{fmtDate(editForm.deliveredAt)}</p>
                    </div>
                  )}
                </div>
              )}

              <hr className="border-gray-100 dark:border-zinc-800" />

              {/* Name + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>الاسم الكامل</FieldLabel>
                  {canEdit
                    ? <input value={editForm.name} onChange={e => set('name')(e.target.value)} placeholder="اسم العميل" className="w-full px-3 py-2.5 text-[13px] rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all" />
                    : <ReadonlyField value={editForm.name} />
                  }
                </div>
                <div>
                  <FieldLabel>رقم الهاتف</FieldLabel>
                  {canEdit
                    ? <input value={editForm.phone} onChange={e => set('phone')(e.target.value)} placeholder="0XXXXXXXXX" className="w-full px-3 py-2.5 text-[13px] rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all" />
                    : <ReadonlyField value={editForm.phone} />
                  }
                </div>
              </div>

              <hr className="border-gray-100 dark:border-zinc-800" />

              {/* Product */}
              <div>
                <FieldLabel locked>المنتج</FieldLabel>
                <ReadonlyField value={editForm.product} />
                <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1 font-medium">اسم المنتج لا يمكن تعديله — يُحدَّد من الكاتالوج</p>
              </div>

              {/* Variant */}
              <div>
                <FieldLabel>المتغير (Variant)</FieldLabel>
                {canEdit ? (
                  <SearchableSelect
                    loading={loadingVariants}
                    value={editForm.variantDetailId}
                    placeholder="اختر المتغير"
                    options={variants.map(v => {
                      const entries = v.name && typeof v.name === 'object' ? Object.entries(v.name) : [];
                      const label = entries.map(([k, val]) => `${k}: ${val}`).join(' | ') || v.id;
                      const hexColors = entries.map(([, val]) => val).filter(val => /^#[0-9a-f]{3,8}$/i.test(val));
                      return { value: v.id, label, sub: `${parseFloat(v.price).toLocaleString()} DA${v.stock != null ? ` · مخزون: ${v.stock}` : ''}`, raw: v, hexColors };
                    })}
                    renderOption={(opt) => (
                      <div className="flex items-center gap-2 min-w-0">
                        {opt.hexColors?.length > 0 && (
                          <div className="flex gap-0.5 flex-shrink-0">
                            {opt.hexColors.map((c, i) => <span key={i} className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" style={{ background: c }} />)}
                          </div>
                        )}
                        <span className="truncate">{opt.label}</span>
                      </div>
                    )}
                    onChange={(opt) => setEditForm(f => ({
                      ...f,
                      variantDetailId: opt.value, variantDetail: opt.raw, variant: opt.label,
                      unityPrice: parseFloat(opt.raw.price) || f.unityPrice,
                      totalPrice: (parseFloat(opt.raw.price) || f.unityPrice) + parseFloat(f.priceShip || 0),
                    }))}
                  />
                ) : (
                  editForm.variantDetail
                    ? <div className="w-full px-3 py-2.5 rounded-xl border bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800"><VariantDisplay variantDetail={editForm.variantDetail} /></div>
                    : <ReadonlyField value="—" />
                )}
                {canEdit && editForm.variantDetail?.stock === 0 && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1.5 flex items-center gap-1"><AlertCircle size={10} /> هذا المتغير غير متوفر في المخزون</p>
                )}
              </div>

              {/* Offer */}
              <div>
                <FieldLabel>العرض (Offer)</FieldLabel>
                {canEdit ? (
                  <>
                    <SearchableSelect
                      loading={loadingOffers}
                      value={editForm.offerId ?? ''}
                      placeholder="بدون عرض"
                      options={[
                        { value: '', label: 'بدون عرض', sub: '', raw: null },
                        ...offers.map(o => ({ value: o.id, label: o.name, sub: `${o.quantity} قطعة · ${parseFloat(o.price).toLocaleString()} DA`, raw: o })),
                      ]}
                      onChange={(opt) => setEditForm(f => {
                        if (!opt.raw) return { ...f, offerId: null, offerObj: null, offer: '' };
                        const ship = parseFloat(f.priceShip) || 0;
                        const offerQty = parseInt(opt.raw.quantity) || 1;
                        const offerPrice = parseFloat(opt.raw.price) || 0;
                        return { ...f, offerId: opt.value, offerObj: opt.raw, offer: opt.raw.name, quantity: offerQty, unityPrice: offerQty > 0 ? Math.round(offerPrice / offerQty) : offerPrice, totalPrice: offerPrice + ship };
                      })}
                    />
                    {editForm.offerObj && (
                      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/15 rounded-xl px-3 py-2.5 mt-2">
                        <div className="flex-1">
                          <p className="text-[11px] font-black text-amber-700 dark:text-amber-400">{editForm.offerObj.name}</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">الكمية: {editForm.offerObj.quantity} — السعر: {parseFloat(editForm.offerObj.price).toLocaleString()} DA</p>
                        </div>
                        <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg flex-shrink-0">مطبّق</span>
                      </div>
                    )}
                  </>
                ) : (
                  editForm.offerObj
                    ? <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/15 rounded-2xl px-4 py-3">
                        <div className="flex-1">
                          <p className="text-[11px] font-black text-amber-700 dark:text-amber-400">{editForm.offerObj.name}</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">الكمية: {editForm.offerObj.quantity} — السعر: {parseFloat(editForm.offerObj.price).toLocaleString()} DA</p>
                        </div>
                        <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg">عرض مطبّق</span>
                      </div>
                    : <ReadonlyField value="بدون عرض" />
                )}
              </div>

              <hr className="border-gray-100 dark:border-zinc-800" />

              {/* Wilaya + Commune */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>الولاية</FieldLabel>
                  {canEdit ? (
                    <SearchableSelect
                      loading={loadingWilayas}
                      value={editForm.wilayaId}
                      placeholder="اختر الولاية"
                      options={wilayas.map(w => ({ value: w.id, label: w.ar_name, sub: w.name, raw: w }))}
                      onChange={(opt) => {
                        setEditForm(f => ({ ...f, wilayaId: opt.value, wilayaObj: opt.raw, wilaya: opt.label, communeId: null, commune: '', communeObj: null, ...recalcShipping(opt.raw, f.typeShip, f.unityPrice) }));
                        fetchCommunes(opt.value);
                      }}
                    />
                  ) : <ReadonlyField value={editForm.wilaya} />}
                </div>
                <div>
                  <FieldLabel>البلدية</FieldLabel>
                  {canEdit ? (
                    <SearchableSelect
                      loading={loadingCommunes}
                      disabled={!editForm.wilayaId}
                      value={editForm.communeId}
                      placeholder={editForm.wilayaId ? 'اختر البلدية' : 'اختر الولاية أولاً'}
                      options={communes.map(c => ({ value: c.id, label: c.ar_name, sub: c.post_code, raw: c }))}
                      onChange={(opt) => setEditForm(f => ({ ...f, communeId: opt.value, communeObj: opt.raw, commune: opt.label }))}
                    />
                  ) : <ReadonlyField value={editForm.commune} />}
                </div>
              </div>

              {/* Shipping prices hint */}
              {canEdit && editForm.wilayaObj && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/15 rounded-2xl px-4 py-3">
                  <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                  <div className="flex items-center gap-4 text-[11px] font-bold flex-wrap">
                    <span className="text-gray-500 dark:text-zinc-400">أسعار شحن {editForm.wilayaObj.ar_name}:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Home size={10} /> منزل: {parseFloat(editForm.wilayaObj.livraisonHome || 0).toLocaleString()} DA</span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Building2 size={10} /> مكتب: {parseFloat(editForm.wilayaObj.livraisonOfice || 0).toLocaleString()} DA</span>
                  </div>
                </div>
              )}

              <hr className="border-gray-100 dark:border-zinc-800" />

              {/* Prices */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <FieldLabel>الكمية</FieldLabel>
                  {canEdit ? (
                    <input type="number" min="1" value={editForm.quantity}
                      onChange={e => { const qty = parseInt(e.target.value) || 1; setEditForm(f => ({ ...f, quantity: qty, totalPrice: (parseFloat(f.unityPrice) || 0) * qty + (parseFloat(f.priceShip) || 0) })); }}
                      className="w-full px-3 py-2.5 text-[13px] rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 outline-none focus:border-emerald-500 transition-all text-center font-bold"
                    />
                  ) : (
                    <div className="w-full px-3 py-2.5 text-[13px] rounded-xl border bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 font-black text-center">×{editForm.quantity || 1}</div>
                  )}
                </div>
                <div>
                  <FieldLabel>سعر الوحدة</FieldLabel>
                  {canEdit ? (
                    <input type="number" value={editForm.unityPrice}
                      onChange={e => { const unit = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, unityPrice: unit, totalPrice: unit * (parseInt(f.quantity) || 1) + (parseFloat(f.priceShip) || 0) })); }}
                      className="w-full px-3 py-2.5 text-[13px] rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 outline-none focus:border-emerald-500 transition-all"
                    />
                  ) : <ReadonlyField value={parseFloat(editForm.unityPrice || 0).toLocaleString()} />}
                </div>
                <div>
                  <FieldLabel>سعر الشحن</FieldLabel>
                  {canEdit ? (
                    <input type="number" value={editForm.priceShip}
                      onChange={e => { const ship = parseFloat(e.target.value) || 0; setEditForm(f => ({ ...f, priceShip: ship, totalPrice: (parseFloat(f.unityPrice) || 0) * (parseInt(f.quantity) || 1) + ship })); }}
                      className="w-full px-3 py-2.5 text-[13px] rounded-xl border bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 outline-none focus:border-emerald-500 transition-all"
                    />
                  ) : <ReadonlyField value={parseFloat(editForm.priceShip || 0).toLocaleString()} />}
                </div>
                <div>
                  <FieldLabel>الإجمالي</FieldLabel>
                  <div className={`w-full px-3 py-2.5 text-[13px] rounded-xl border font-black select-none ${canEdit ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                    {parseFloat(editForm.totalPrice || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Total summary (view mode) */}
              {!isEditing && (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 rounded-2xl px-5 py-3.5">
                  <span className="text-[12px] text-gray-500 dark:text-zinc-500 font-bold">الإجمالي الكلي</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {parseFloat(editForm.totalPrice || 0).toLocaleString()}
                    <span className="text-[12px] text-emerald-500 mr-1 font-bold">DA</span>
                  </span>
                </div>
              )}

              <hr className="border-gray-100 dark:border-zinc-800" />

              {/* TypeShip + Platform + Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel>نوع التوصيل</FieldLabel>
                  {canEdit ? (
                    <div className="relative">
                      <select value={editForm.typeShip}
                        onChange={e => { const t = e.target.value; setEditForm(f => ({ ...f, typeShip: t, ...recalcShipping(f.wilayaObj, t, f.unityPrice) })); }}
                        className="w-full px-3 py-2.5 text-[13px] border rounded-xl outline-none appearance-none bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 focus:border-emerald-500 transition-all cursor-pointer">
                        {typeShipOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  ) : <ReadonlyField value={typeShipOptions.find(t => t.value === editForm.typeShip)?.label || ''} />}
                </div>
                <div>
                  <FieldLabel locked>المنصة</FieldLabel>
                  <div className="pt-0.5"><PlatformBadge platform={editForm.platform} /></div>
                </div>
                <div>
                  <FieldLabel>الحالة</FieldLabel>
                  {canEdit ? (
                    <div className="relative">
                      <select value={editForm.status} onChange={e => set('status')(e.target.value)}
                        className="w-full px-3 py-2.5 text-[13px] border rounded-xl outline-none appearance-none bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 focus:border-emerald-500 transition-all cursor-pointer">
                        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  ) : <div className="pt-0.5"><StatusPill status={editForm.status} /></div>}
                </div>
              </div>

              {/* Status banners */}
              {!isEditing && isShipping && (
                <div className="flex items-center gap-3 bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-500/15 rounded-2xl px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse flex-shrink-0" />
                  <span className="text-[12px] text-cyan-700 dark:text-cyan-400 font-bold">الطلب في طريقه إلى العميل — يتم الشحن الآن</span>
                </div>
              )}
              {!isEditing && isDelivered && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 rounded-2xl px-4 py-3">
                  <CheckCheck size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-[12px] text-emerald-700 dark:text-emerald-400 font-bold">تم تسليم الطلب بنجاح</span>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ══ Footer ══ */}
        {!fetching && !fetchError && editForm && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">

            {/* Edit mode */}
            {isEditing ? (
              <div className="flex items-center justify-between">
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-[12px] font-bold transition-all">
                  <Trash2 size={14} /> حذف
                </button>
                <div className="flex gap-2">
                  <button onClick={handleDiscard} className="flex items-center gap-1.5 px-4 py-2.5 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-[12px] font-bold transition-all">
                    <X size={14} /> تجاهل
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[12px] font-black shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} حفظ التغييرات
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-[12px] font-bold transition-all">
                  <Trash2 size={14} /> حذف
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusDropdown value={editForm.status} onChange={handleStatusChange} loading={savingStatus} />
                  {canUpload && (
                    <button onClick={handleUploadShipping} className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[12px] font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
                      <Upload size={14} /> رفع للشحن
                    </button>
                  )}
                  {isShipping && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl text-cyan-700 dark:text-cyan-400 text-[12px] font-bold">
                      <Truck size={14} /> يتم الشحن <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    </div>
                  )}
                  {isDelivered && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-[12px] font-bold">
                      <CheckCheck size={14} /> تم التوصيل
                    </div>
                  )}
                  <button onClick={handleEditClick}
                    className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-[12px] font-bold transition-all ${orderLocked ? 'text-gray-300 dark:text-zinc-600 border-gray-100 dark:border-zinc-800 cursor-not-allowed bg-gray-50 dark:bg-zinc-800/30' : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-700'}`}>
                    {orderLocked ? <Lock size={13} /> : <Edit3 size={14} />} تعديل
                  </button>
                  <button onClick={onClose} className="px-4 py-2.5 text-gray-500 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl text-[12px] font-bold transition-all">
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}