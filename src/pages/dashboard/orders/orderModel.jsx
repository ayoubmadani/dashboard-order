import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Loader2, MapPin, AlertCircle,
  ChevronDown, Save, ShoppingBag, CheckCircle2, Package
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

export const StatusEnum = {
  PENDING: 'pending', APPL1: 'appl1', APPL2: 'appl2', APPL3: 'appl3',
  CONFIRMED: 'confirmed', SHIPPING: 'shipping', CANCELLED: 'cancelled',
  RETURNED: 'returned', DELIVERED: 'delivered', POSTPONED: 'postponed',
};

const STATUS_META = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  appl1:     { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  appl2:     { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  appl3:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  shipping:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  delivered: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  returned:  { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  postponed: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

const S = `
  .om { font-family: 'Inter', system-ui, sans-serif; }
  .om * { box-sizing: border-box; }

  .om-backdrop {
    position: fixed; inset: 0; z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 12px;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
    animation: omFade .18s ease;
  }
  @keyframes omFade { from { opacity:0 } to { opacity:1 } }
  @keyframes omUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

  .om-panel {
    position: relative; width: 100%; max-width: 680px;
    max-height: 92vh; display: flex; flex-direction: column;
    border-radius: 20px; overflow: hidden;
    background: #fff;
    box-shadow: 0 24px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06);
    animation: omUp .24s cubic-bezier(.22,1,.36,1);
  }
  .dark .om-panel { background: #111114; box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06); }

  /* Header */
  .om-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f4;
    flex-shrink: 0;
  }
  .dark .om-header { border-bottom-color: rgba(255,255,255,0.07); }

  .om-header-left { display: flex; align-items: center; gap: 10px; }

  .om-icon-box {
    width: 34px; height: 34px; border-radius: 10px;
    background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
    display: flex; align-items: center; justify-content: center; color: #6366f1;
    flex-shrink: 0;
  }

  .om-title { font-size: 14px; font-weight: 700; color: #111; line-height: 1; }
  .dark .om-title { color: #f0f0f8; }
  .om-sub { font-size: 11px; color: #9a9ab0; margin-top: 3px; font-variant-numeric: tabular-nums; }

  .om-status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 700; letter-spacing: .02em;
  }
  .om-status-dot { width: 5px; height: 5px; border-radius: 50%; }

  .om-x {
    width: 32px; height: 32px; border-radius: 9px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid #eee; color: #9a9ab0;
    transition: all .15s ease;
  }
  .dark .om-x { border-color: rgba(255,255,255,0.08); }
  .om-x:hover { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); color: #ef4444; }

  /* Body */
  .om-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
  .om-body::-webkit-scrollbar { width: 4px; }
  .om-body::-webkit-scrollbar-thumb { background: #e0e0ea; border-radius: 4px; }
  .dark .om-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

  /* Card */
  .om-card {
    background: #fafafa; border: 1px solid #ebebf0;
    border-radius: 16px; padding: 16px;
  }
  .dark .om-card { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.07); }

  .om-card-title {
    font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
    color: #9a9ab8; display: flex; align-items: center; gap: 6px; margin-bottom: 14px;
  }
  .om-card-title svg { color: #6366f1; }

  /* Fields */
  .om-row { display: grid; gap: 10px; }
  .om-row.cols2 { grid-template-columns: 1fr 1fr; }

  .om-field { display: flex; flex-direction: column; gap: 5px; }
  .om-label {
    font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
    color: #b0b0c8;
  }

  .om-input, .om-select {
    padding: 9px 12px; border-radius: 10px;
    border: 1px solid #e4e4ec; background: #fff;
    font-size: 13px; font-weight: 500; color: #1a1a2e;
    outline: none; transition: border-color .15s, box-shadow .15s;
    width: 100%;
  }
  .dark .om-input, .dark .om-select {
    background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #e8e8f4;
  }
  .om-input:focus, .om-select:focus {
    border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .om-input:disabled {
    background: #f5f5f8; color: #b0b0c0; cursor: not-allowed;
  }
  .dark .om-input:disabled { background: rgba(255,255,255,0.03); color: #3a3a50; }

  .om-select {
    appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9ab8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 11px center; padding-right: 30px;
  }
  .om-select option { background: #fff; color: #1a1a2e; }
  .dark .om-select option { background: #18181f; color: #e8e8f4; }
  .om-select:disabled { cursor: not-allowed; opacity: .5; }

  /* Toggle */
  .om-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .om-toggle-btn {
    padding: 9px; border-radius: 10px; cursor: pointer;
    font-size: 12px; font-weight: 700;
    border: 1px solid #e4e4ec; background: #fff; color: #9a9ab8;
    transition: all .15s ease; display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .dark .om-toggle-btn { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.09); }
  .om-toggle-btn.active {
    background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.4);
    color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
  }
  .om-toggle-btn:hover:not(.active) { border-color: #ccc; color: #6a6a80; }

  /* Items */
  .om-items-list { display: flex; flex-direction: column; gap: 10px; }

  .om-item {
    background: #fff; border: 1px solid #ebebf0; border-radius: 12px; padding: 12px 14px;
    transition: border-color .15s;
  }
  .dark .om-item { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07); }
  .om-item:hover { border-color: #d0d0e0; }
  .dark .om-item:hover { border-color: rgba(255,255,255,0.13); }

  .om-item-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 10px; margin-bottom: 10px; padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f6;
  }
  .dark .om-item-header { border-bottom-color: rgba(255,255,255,0.06); }

  .om-item-badge {
    width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
    background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; color: #6366f1;
  }

  .om-item-name { font-size: 12px; font-weight: 600; color: #1a1a2e; flex: 1; line-height: 1.4; }
  .dark .om-item-name { color: #d8d8f0; }

  .om-item-price { font-size: 13px; font-weight: 800; color: #10b981; flex-shrink: 0; }

  .om-item-controls { display: grid; gap: 8px; }
  .om-item-controls.has-offer { grid-template-columns: 72px 1fr; }
  .om-item-controls.no-offer  { grid-template-columns: 72px; }

  .om-qty-input {
    padding: 8px 6px; border-radius: 10px; text-align: center;
    border: 1px solid #e4e4ec; background: #fff;
    font-size: 14px; font-weight: 800; color: #1a1a2e;
    outline: none; width: 100%;
    transition: border-color .15s, box-shadow .15s;
  }
  .dark .om-qty-input { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #e8e8f4; }
  .om-qty-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  /* Offer */
  .om-offer-select {
    padding: 8px 28px 8px 10px; border-radius: 10px;
    border: 1px solid rgba(249,115,22,0.25); background: rgba(249,115,22,0.04);
    font-size: 12px; font-weight: 600; color: #f97316;
    outline: none; cursor: pointer; appearance: none; width: 100%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 9px center;
    transition: border-color .15s;
  }
  .om-offer-select:focus { border-color: rgba(249,115,22,0.5); box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }
  .om-offer-select option { background: #fff; color: #1a1a2e; }
  .dark .om-offer-select option { background: #18181f; color: #e8e8f4; }

  /* Variant */
  .om-variant-btn {
    width: 100%; margin-top: 8px; padding: 8px 12px; border-radius: 10px; cursor: pointer;
    border: 1px solid rgba(139,92,246,0.25); background: rgba(139,92,246,0.05);
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 500; color: #8b5cf6;
    transition: all .15s ease;
  }
  .om-variant-btn:hover { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.4); }

  .om-variant-dd {
    position: absolute; z-index: 50; top: calc(100% + 5px); left: 0; right: 0;
    background: #fff; border: 1px solid #e8e8f4; border-radius: 12px;
    padding: 5px; box-shadow: 0 16px 48px rgba(0,0,0,0.12);
    max-height: 180px; overflow-y: auto;
  }
  .dark .om-variant-dd { background: #1a1a22; border-color: rgba(255,255,255,0.1); }
  .om-variant-dd::-webkit-scrollbar { width: 3px; }
  .om-variant-dd::-webkit-scrollbar-thumb { background: #e0e0ea; border-radius: 3px; }

  .om-variant-opt {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 9px; border-radius: 8px; cursor: pointer;
    font-size: 12px; font-weight: 500; color: #4a4a60;
    transition: background .1s ease;
  }
  .dark .om-variant-opt { color: #a0a0c0; }
  .om-variant-opt:hover { background: #f5f5fa; }
  .dark .om-variant-opt:hover { background: rgba(255,255,255,0.05); }
  .om-variant-opt.sel { background: rgba(139,92,246,0.07); color: #7c3aed; font-weight: 600; }

  /* Totals */
  .om-totals {
    background: #111118; border-radius: 14px; padding: 14px 16px;
    display: flex; flex-direction: column; gap: 6px;
    margin-top: 4px;
  }
  .om-tot-row { display: flex; justify-content: space-between; align-items: center; }
  .om-tot-label { font-size: 12px; color: #5a5a70; }
  .om-tot-val { font-size: 12px; font-weight: 600; color: #8a8aa0; }
  .om-tot-divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 4px 0; }
  .om-tot-main-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #5a5a70; }
  .om-tot-main-val { font-size: 22px; font-weight: 800; color: #34d399; }

  /* Footer */
  .om-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 8px;
    padding: 14px 20px; border-top: 1px solid #f0f0f4; flex-shrink: 0;
    background: #fff;
  }
  .dark .om-footer { border-top-color: rgba(255,255,255,0.07); background: #111114; }

  .om-btn-cancel {
    padding: 9px 18px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-weight: 600; color: #9a9ab8;
    background: transparent; border: 1px solid #e4e4ec;
    transition: all .15s ease;
  }
  .dark .om-btn-cancel { border-color: rgba(255,255,255,0.09); }
  .om-btn-cancel:hover { color: #6a6a80; background: #f5f5f8; }
  .dark .om-btn-cancel:hover { background: rgba(255,255,255,0.05); }

  .om-btn-save {
    padding: 9px 22px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-weight: 700; color: #fff;
    background: #6366f1; border: 1px solid rgba(99,102,241,0.4);
    box-shadow: 0 4px 14px rgba(99,102,241,0.3);
    display: flex; align-items: center; gap: 7px;
    transition: all .15s ease;
  }
  .om-btn-save:hover { background: #4f46e5; box-shadow: 0 6px 20px rgba(99,102,241,0.4); transform: translateY(-1px); }
  .om-btn-save:active { transform: scale(.98); }
  .om-btn-save:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }

  /* Loading overlay */
  .om-loading {
    position: absolute; inset: 0; border-radius: 20px; z-index: 50;
    background: rgba(255,255,255,0.82); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
  }
  .dark .om-loading { background: rgba(17,17,20,0.85); }
`;

export default function OrderModal({ isOpen, onClose, cartData, onRefresh }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';

  const [editedCart, setEditedCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wilayasData, setWilayaData] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [productOptions, setProductOptions] = useState({});
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  const token = getAccessToken();

  useEffect(() => {
    if (!isOpen) return;
    axios.get(`${baseURL}/shipping/get-shipping`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setWilayaData(r.data || []))
      .catch(e => console.error(e));
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen || !cartData) return;
    const initialCart = {
      ...cartData,
      customerWilayaId: cartData.customerWilayaId ?? cartData.customerWilaya?.id,
      customerCommuneId: cartData.customerCommuneId ?? cartData.customerCommune?.id,
      priceShip: parseFloat(cartData.priceShip || 0),
      typeShip: cartData.typeShip || 'home',
      status: cartData.status || cartData.items[0]?.status || 'pending',
      items: cartData.items.map(item => {
        const baseTotal = Number(item.totalPrice || 0) - Number(item.priceShip || 0);
        const initPrice = item.quantity > 0 ? baseTotal / item.quantity : baseTotal;
        return { 
          ...item, 
          initPrice, 
          itemTotal: baseTotal,
          productId: item.productId || item.product?.id 
        };
      })
    };
    setEditedCart(initialCart);
    if (initialCart.customerWilaya?.id) fetchCommunes(initialCart.customerWilaya.id);

    const fetchOptions = async () => {
      const ids = [...new Set(cartData.items.map(i => i.productId || i.product?.id).filter(Boolean))];
      const opts = { ...productOptions };
      await Promise.all(ids.map(async pid => {
        if (!opts[pid]) {
          try {
            const [vR, oR] = await Promise.all([
              axios.get(`${baseURL}/products/${pid}/variants`, { headers: { Authorization: `Bearer ${token}` } }),
              axios.get(`${baseURL}/products/${pid}/offers`,   { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            opts[pid] = { variants: vR.data || [], offers: oR.data || [] };
          } catch (e) { console.error(e); }
        }
      }));
      setProductOptions(opts);
    };
    fetchOptions();
  }, [isOpen, cartData, token]);

  const fetchCommunes = (wilayaId) => {
    setCommunes([]);
    axios.get(`${baseURL}/shipping/get-communes/${wilayaId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setCommunes(r.data || []))
      .catch(e => console.error(e));
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
      ...prev, customerWilayaId: parseInt(wilayaId),
      customerCommuneId: null, customerWilaya: w, priceShip,
    }));
    fetchCommunes(wilayaId);
  };

  const handleChangeTypeShip = (typeShip) => {
    const w = wilayasData.find(x => x.id === parseInt(editedCart.customerWilayaId));
    if (!w) { handleGeneralChange('typeShip', typeShip); return; }
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
        let u = { ...item, [field]: value };
        if (field === 'variantDetailId') {
          const v = productOptions[item.productId]?.variants.find(x => String(x.id) === String(value));
          if (v && v.price > -1) u.finalPrice = parseFloat(v.price);
          u.variantDetail = v;
        }
        if (field === 'offerId') {
          const o = productOptions[item.productId]?.offers.find(x => String(x.id) === String(value));
          if (o) { u.finalPrice = parseFloat(o.price); u.offer = o; }
          else {
            u.finalPrice = parseFloat(u.variantDetail?.price > -1 ? u.variantDetail.price : u.product?.price || 0);
            u.offer = null;
          }
        }
        u.itemTotal = u.finalPrice * u.quantity;
        return u;
      })
    }));
  };

  const handleSave = async () => {
    if (!editedCart.items.length) return;
    
    const invalidItems = editedCart.items.filter((item) => {
      const productId = item.productId || item.product?.id;
      return !productId;
    });
    
    if (invalidItems.length > 0) {
      console.error('Items missing productId:', invalidItems);
      alert(t('modal.save_failed') || 'فشل الحفظ: بعض المنتجات لا تحتوي على معرف');
      return;
    }
    
    setLoading(true);
    try {
      const dtos = editedCart.items.map((item, i) => {
        const productId = item.productId || item.product?.id;
        
        return {
          customerName: editedCart.customerName,
          customerPhone: editedCart.customerPhone,
          customerWilayaId: editedCart.customerWilayaId,
          customerCommuneId: editedCart.customerCommuneId,
          status: editedCart.status,
          typeShip: editedCart.typeShip,
          priceShip: i === 0 ? editedCart.priceShip : 0,
          productId: productId,
          quantity: item.quantity,
          variantDetailId: item.variantDetailId ?? null,
          offerId: item.offerId ?? null,
          finalPrice: item.finalPrice,
          totalPrice: item.finalPrice * item.quantity + (i === 0 ? editedCart.priceShip : 0),
        };
      });
      
      console.log('Sending DTOs:', dtos);
      
      await axios.patch(
        `${baseURL}/orders/${editedCart.id}`, dtos,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh?.();
      onClose();
    } catch (e) {
      alert(t('modal.save_failed') || 'فشل حفظ التغييرات');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    { value: StatusEnum.PENDING,   label: t('status.pending') },
    { value: StatusEnum.APPL1,     label: t('status.appl1') },
    { value: StatusEnum.APPL2,     label: t('status.appl2') },
    { value: StatusEnum.APPL3,     label: t('status.appl3') },
    { value: StatusEnum.CONFIRMED, label: t('status.confirmed') },
    { value: StatusEnum.SHIPPING,  label: t('status.shipping') },
    { value: StatusEnum.DELIVERED, label: t('status.delivered') },
    { value: StatusEnum.CANCELLED, label: t('status.cancelled') },
    { value: StatusEnum.RETURNED,  label: t('status.returned') },
    { value: StatusEnum.POSTPONED, label: t('status.postponed') },
  ];

  if (!editedCart) return (
    <div className="om">
      <style>{S}</style>
      <div className="om-backdrop">
        <Loader2 size={28} className="text-indigo-500 animate-spin" />
      </div>
    </div>
  );

  const hasItems = editedCart.items?.length > 0;
  const totalItemsPrice = editedCart.items.reduce((s, it) => s + it.finalPrice * it.quantity, 0);
  const finalCartTotal = totalItemsPrice + editedCart.priceShip;
  const statusMeta = STATUS_META[editedCart.status] || STATUS_META.pending;
  const statusLabel = statusOptions.find(s => s.value === editedCart.status)?.label || editedCart.status;
  const shortId = (editedCart.cartId || editedCart.id || '').split('-')[0].toUpperCase();

  return (
    <div className="om" dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{S}</style>
      <div className="om-backdrop">
        <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

        <div className="om-panel">
          {loading && (
            <div className="om-loading">
              <Loader2 size={28} className="text-indigo-500 animate-spin" />
            </div>
          )}

          {/* Header */}
          <div className="om-header">
            <div className="om-header-left">
              <div className="om-icon-box"><Package size={16} /></div>
              <div>
                <div className="om-title">{t('modal.section_shipping') || 'تعديل الطلب'}</div>
                <div className="om-sub">#{shortId}</div>
              </div>
              <div
                className="om-status-pill"
                style={{ background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.color}30` }}
              >
                <div className="om-status-dot" style={{ background: statusMeta.color }} />
                {statusLabel}
              </div>
            </div>
            <button className="om-x" onClick={onClose}><X size={15} /></button>
          </div>

          {/* Body */}
          <div className="om-body">

            {/* ① بيانات الزبون */}
            <div className="om-card">
              <div className="om-card-title">
                <MapPin size={11} />
                {t('modal.section_shipping') || 'بيانات الزبون والتوصيل'}
              </div>

              <div className="om-row cols2" style={{ marginBottom: 10 }}>
                <div className="om-field">
                  <label className="om-label">{t('modal.customer_name')}</label>
                  <input
                    type="text" className="om-input"
                    value={editedCart.customerName || ''}
                    onChange={e => handleGeneralChange('customerName', e.target.value)}
                  />
                </div>
                <div className="om-field">
                  <label className="om-label">{t('modal.customer_phone')}</label>
                  <input type="text" dir="ltr" disabled className="om-input" value={editedCart.customerPhone || ''} />
                </div>
              </div>

              <div className="om-row cols2" style={{ marginBottom: 10 }}>
                <div className="om-field">
                  <label className="om-label">{t('modal.wilaya')}</label>
                  <select
                    className="om-select"
                    value={editedCart.customerWilayaId || ''}
                    onChange={e => handleWilayaChange(e.target.value)}
                  >
                    <option value="">{t('modal.select_wilaya')}</option>
                    {wilayasData.map(w => <option key={w.id} value={w.id}>{w.id} - {w.ar_name}</option>)}
                  </select>
                </div>
                <div className="om-field">
                  <label className="om-label">{t('modal.commune')}</label>
                  <select
                    className="om-select"
                    value={editedCart.customerCommuneId || ''}
                    onChange={e => handleGeneralChange('customerCommuneId', parseInt(e.target.value))}
                    disabled={!communes.length}
                  >
                    <option value="">{t('modal.select_commune')}</option>
                    {communes.map(c => <option key={c.id} value={c.id}>{c.ar_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="om-row cols2">
                <div className="om-field">
                  <label className="om-label">{t('modal.ship_type')}</label>
                  <div className="om-toggle">
                    {[
                      { key: 'home',   label: t('modal.ship_home'),   icon: '🏠' },
                      { key: 'office', label: t('modal.ship_office'), icon: '🏢' },
                    ].map(o => (
                      <button
                        key={o.key} type="button"
                        className={`om-toggle-btn ${editedCart.typeShip === o.key ? 'active' : ''}`}
                        onClick={() => handleChangeTypeShip(o.key)}
                      >
                        {o.icon} {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="om-field">
                  <label className="om-label">{t('modal.status_label')}</label>
                  <select
                    className="om-select"
                    value={editedCart.status}
                    onChange={e => handleGeneralChange('status', e.target.value)}
                    style={{ borderColor: `${statusMeta.color}50`, color: statusMeta.color, fontWeight: 700 }}
                  >
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ② محتويات السلة */}
            <div className="om-card">
              <div className="om-card-title">
                <ShoppingBag size={11} />
                محتويات السلة
                <span style={{ marginRight: 'auto', color: '#c0c0da', fontSize: 11, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                  {editedCart.items.length} منتج
                </span>
              </div>

              {hasItems ? (
                <div className="om-items-list">
                  {editedCart.items.map((item, idx) => {
                    const pOpts = productOptions[item.productId] || { variants: [], offers: [] };
                    const isDropOpen = dropdownOpenId === item.id;
                    const variantText = Array.isArray(item.variantDetail?.name)
                      ? item.variantDetail.name
                          .filter(a => a.displayMode !== 'color' && a.displayMode !== 'image')
                          .map(a => a.value).join(' / ')
                      : '';
                    const variantVisuals = Array.isArray(item.variantDetail?.name)
                      ? item.variantDetail.name.filter(a => a.displayMode === 'color' || a.displayMode === 'image')
                      : [];

                    return (
                      <div key={item.id} className="om-item">
                        <div className="om-item-header">
                          <div className="om-item-badge">{idx + 1}</div>
                          <div className="om-item-name">
                            {item.product?.name || item.productName || t('modal.product_unknown')}
                          </div>
                          <div className="om-item-price">
                            {parseFloat(item.finalPrice || 0).toLocaleString()} DA
                          </div>
                        </div>

                        <div className={`om-item-controls ${pOpts.offers.length ? 'has-offer' : 'no-offer'}`}>
                          <div className="om-field">
                            <label className="om-label">الكمية</label>
                            <input
                              type="number" min="1" className="om-qty-input"
                              value={item.quantity || 1}
                              onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          {pOpts.offers.length > 0 && (
                            <div className="om-field">
                              <label className="om-label">{t('modal.offer_label')}</label>
                              <select
                                className="om-offer-select"
                                value={item.offerId || ''}
                                onChange={e => handleItemChange(item.id, 'offerId', e.target.value)}
                              >
                                <option value="">{t('modal.offer_none')}</option>
                                {pOpts.offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>

                        {pOpts.variants.length > 0 && (
                          <div style={{ position: 'relative', marginTop: 8 }}>
                            <label className="om-label" style={{ marginBottom: 5, display: 'block' }}>
                              {t('modal.variant_label')}
                            </label>
                            <button type="button" className="om-variant-btn"
                              onClick={() => setDropdownOpenId(isDropOpen ? null : item.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                {variantVisuals.map((a, i) => (
                                  <div key={i}>
                                    {a.displayMode === 'color' && (
                                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: a.value, border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                                    )}
                                    {a.displayMode === 'image' && (
                                      <img src={a.value} style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} alt="" />
                                    )}
                                  </div>
                                ))}
                                {variantText
                                  ? <span>{variantText}</span>
                                  : <span style={{ color: '#b0b0c8' }}>{t('modal.variant_placeholder')}</span>
                                }
                              </div>
                              <ChevronDown size={13} style={{ flexShrink: 0, transition: 'transform .2s', transform: isDropOpen ? 'rotate(180deg)' : 'none' }} />
                            </button>

                            {isDropOpen && (
                              <div className="om-variant-dd">
                                {pOpts.variants.map(v => {
                                  const attrs = Array.isArray(v.name) ? v.name : [];
                                  const txt = attrs.filter(a => a.displayMode !== 'color' && a.displayMode !== 'image').map(a => a.value).join(' / ');
                                  const sel = String(item.variantDetailId) === String(v.id);
                                  return (
                                    <div key={v.id}
                                      className={`om-variant-opt ${sel ? 'sel' : ''}`}
                                      onClick={() => { handleItemChange(item.id, 'variantDetailId', v.id); setDropdownOpenId(null); }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {attrs.map((a, i) => (
                                          <div key={i}>
                                            {a.displayMode === 'color' && <div style={{ width: 13, height: 13, borderRadius: '50%', background: a.value, border: '1px solid rgba(0,0,0,0.1)' }} />}
                                            {a.displayMode === 'image' && <img src={a.value} style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover' }} alt="" />}
                                          </div>
                                        ))}
                                        <span>{txt}</span>
                                      </div>
                                      {sel && <CheckCircle2 size={13} style={{ color: '#8b5cf6' }} />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* الإجمالي */}
                  <div className="om-totals">
                    <div className="om-tot-row">
                      <span className="om-tot-label">إجمالي المنتجات ({editedCart.items.length})</span>
                      <span className="om-tot-val">{parseFloat(totalItemsPrice).toLocaleString()} DA</span>
                    </div>
                    <div className="om-tot-row">
                      <span className="om-tot-label">{t('modal.price_ship')}</span>
                      <span className="om-tot-val">{parseFloat(editedCart.priceShip).toLocaleString()} DA</span>
                    </div>
                    <hr className="om-tot-divider" />
                    <div className="om-tot-row">
                      <span className="om-tot-main-label">{t('modal.price_total')}</span>
                      <span className="om-tot-main-val">{parseFloat(finalCartTotal).toLocaleString()} DA</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#b0b0c8' }}>
                  <AlertCircle size={24} />
                  <p style={{ fontSize: 13 }}>لا توجد منتجات</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="om-footer">
            <button className="om-btn-cancel" onClick={onClose}>{t('modal.close')}</button>
            <button className="om-btn-save" onClick={handleSave} disabled={loading || !hasItems}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" />{t('modal.saving')}</>
                : <><Save size={14} />{t('modal.save')}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}