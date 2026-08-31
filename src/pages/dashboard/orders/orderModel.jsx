import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Save, Package, CheckCircle2, MapPin, ExternalLink, Phone } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

export const StatusEnum = {
  PENDING: 'pending', APPL1: 'appl1', APPL2: 'appl2', APPL3: 'appl3',
  CONFIRMED: 'confirmed', SHIPPING: 'shipping', CANCELLED: 'cancelled',
  RETURNED: 'returned', DELIVERED: 'delivered', POSTPONED: 'postponed',
};

const STATUS_META = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', labelColor: '#92400e' },
  appl1:     { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', labelColor: '#5b21b6' },
  appl2:     { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', labelColor: '#3730a3' },
  appl3:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', labelColor: '#1e40af' },
  confirmed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', labelColor: '#065f46' },
  shipping:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', labelColor: '#155e75' },
  delivered: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', labelColor: '#14532d' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', labelColor: '#991b1b' },
  returned:  { color: '#f97316', bg: 'rgba(249,115,22,0.12)', labelColor: '#7c2d12' },
  postponed: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', labelColor: '#6b21a8' },
};

const S = `
  .om-backdrop { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); animation:omFade .18s ease; }
  @keyframes omFade { from{opacity:0} to{opacity:1} }
  @keyframes omUp { from{opacity:0;transform:translateY(16px)scale(.97)} to{opacity:1;transform:translateY(0)scale(1)} }
  .om-panel { position:relative; width:100%; max-width:440px; max-height:90vh; display:flex; flex-direction:column; border-radius:20px; overflow:hidden; background:#fff; box-shadow:0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05); animation:omUp .22s cubic-bezier(.22,1,.36,1); }
  .dark .om-panel { background:#18181b; box-shadow:0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06); }
  .om-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #f0f0f5; flex-shrink:0; }
  .dark .om-header { border-bottom-color:rgba(255,255,255,0.07); }
  .om-header-left { display:flex; align-items:center; gap:10px; }
  .om-icon-box { width:32px; height:32px; border-radius:10px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.18); display:flex; align-items:center; justify-content:center; color:#6366f1; flex-shrink:0; }
  .om-title { font-size:13.5px; font-weight:800; color:#111; line-height:1.1; }
  .dark .om-title { color:#f0f0f8; }
  .om-sub { font-size:11px; color:#9a9ab0; margin-top:2px; font-variant-numeric:tabular-nums; }
  .om-status-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:.02em; }
  .om-status-dot { width:5px; height:5px; border-radius:50%; }
  .om-x { width:30px; height:30px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid #eee; color:#9a9ab0; transition:all .15s; }
  .dark .om-x { border-color:rgba(255,255,255,0.08); }
  .om-x:hover { background:rgba(239,68,68,.08); border-color:rgba(239,68,68,.25); color:#ef4444; }
  .om-body { flex:1; overflow-y:auto; padding:14px 18px; display:flex; flex-direction:column; gap:12px; }
  .om-body::-webkit-scrollbar { width:4px; }
  .om-body::-webkit-scrollbar-thumb { background:#e0e0ea; border-radius:4px; }
  .dark .om-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); }
  .om-card { background:#fafafa; border:1px solid #ebebf0; border-radius:14px; padding:14px; }
  .dark .om-card { background:rgba(255,255,255,0.035); border-color:rgba(255,255,255,0.07); }
  .om-card-title { font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#9a9ab8; display:flex; align-items:center; gap:6px; margin-bottom:10px; }
  .om-info-row { display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:2.5px 0; }
  .om-info-label { font-size:11px; color:#9a9ab8; flex-shrink:0; }
  .om-info-val { font-size:12.5px; font-weight:700; color:#2a2a3a; text-align:end; }
  .dark .om-info-val { color:#dcdce8; }
  .om-item-line { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 0; }
  .om-item-line + .om-item-line { border-top:1px dashed #ececf2; }
  .dark .om-item-line + .om-item-line { border-top-color:rgba(255,255,255,0.06); }
  .om-item-line-name { font-size:12px; font-weight:600; color:#2a2a3a; }
  .dark .om-item-line-name { color:#d8d8f0; }
  .om-item-line-meta { font-size:11px; color:#9a9ab8; flex-shrink:0; font-weight:600; }
  .om-totals { display:flex; align-items:center; justify-content:space-between; margin-top:6px; padding-top:8px; border-top:1px solid #ececf2; }
  .dark .om-totals { border-top-color:rgba(255,255,255,0.07); }
  .om-tot-label { font-size:11px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:#9a9ab8; }
  .om-tot-val { font-size:17px; font-weight:900; color:#10b981; }
  .om-status-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; }
  .om-status-btn { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:8px 10px; border-radius:10px; cursor:pointer; border:1.5px solid #ececf2; background:#fff; color:#6a6a80; font-size:12px; font-weight:700; transition:all .12s; }
  .dark .om-status-btn { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.08); color:#9a9ab8; }
  .om-status-btn:hover { border-color:#d0d0e0; }
  .dark .om-status-btn:hover { border-color:rgba(255,255,255,0.16); }
  .om-status-btn .dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .om-status-name { display:flex; align-items:center; gap:6px; }
  .om-footer { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 18px; border-top:1px solid #f0f0f4; flex-shrink:0; background:#fff; }
  .dark .om-footer { border-top-color:rgba(255,255,255,0.07); background:#18181b; }
  .om-link-full { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#6366f1; cursor:pointer; background:none; border:none; padding:0; }
  .om-link-full:hover { text-decoration:underline; }
  .om-footer-actions { display:flex; align-items:center; gap:8px; }
  .om-btn-cancel { padding:8px 16px; border-radius:10px; cursor:pointer; font-size:12.5px; font-weight:700; color:#9a9ab8; background:transparent; border:1px solid #e4e4ec; transition:all .15s; }
  .dark .om-btn-cancel { border-color:rgba(255,255,255,0.09); }
  .om-btn-cancel:hover { color:#6a6a80; background:#f5f5f8; }
  .dark .om-btn-cancel:hover { background:rgba(255,255,255,0.05); }
  .om-btn-save { padding:8px 18px; border-radius:10px; cursor:pointer; font-size:12.5px; font-weight:800; color:#fff; background:#6366f1; border:none; box-shadow:0 4px 14px rgba(99,102,241,0.3); display:flex; align-items:center; gap:6px; transition:all .15s; }
  .om-btn-save:hover { background:#4f46e5; box-shadow:0 6px 20px rgba(99,102,241,0.4); transform:translateY(-1px); }
  .om-btn-save:active { transform:scale(.98); }
  .om-btn-save:disabled { opacity:.45; cursor:not-allowed; transform:none !important; }
  .om-loading { position:absolute; inset:0; border-radius:20px; z-index:50; background:rgba(255,255,255,0.85); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; }
  .dark .om-loading { background:rgba(24,24,27,0.9); }
`;

export default function OrderModal({ isOpen, onClose, cartData, onRefresh }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();

  const [status, setStatus] = useState(cartData?.status || 'pending');
  const [loading, setLoading] = useState(false);
  const token = getAccessToken();

  useEffect(() => {
    if (isOpen && cartData) setStatus(cartData.status || 'pending');
  }, [isOpen, cartData]);

  if (!isOpen || !cartData) return null;

  const statusOptions = Object.values(StatusEnum).map(value => ({
    value, label: t(`status.${value}`),
  }));

  const meta = STATUS_META[cartData.status] || STATUS_META.pending;
  const currentLabel = statusOptions.find(s => s.value === cartData.status)?.label || cartData.status;
  const shortId = (cartData.cartId || cartData.id || '').slice(0, 8).toUpperCase();
  const items = cartData.items || [];
  const hasChanges = status !== cartData.status;

  const goFull = () => { onClose(); navigate(`/dashboard/orders/${cartData.id}`); };

  const handleSave = async () => {
    if (!hasChanges) return;
    setLoading(true);
    try {
      const dtos = items.map(item => ({
        status, productId: item.productId || item.product?.id, quantity: item.quantity,
        variantDetailId: item.variantDetailId ?? null, offerId: item.offerId ?? null,
        finalPrice: item.finalPrice, totalPrice: item.finalPrice * item.quantity,
      }));
      await axios.patch(`${baseURL}/orders/${cartData.id}`, dtos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh?.(); onClose();
    } catch (e) {
      alert(t('modal.save_failed') || 'فشل الحفظ');
      console.error(e);
    } finally { setLoading(false); }
  };

  return (
    <div className="om" dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{S}</style>
      <div className="om-backdrop">
        <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
        <div className="om-panel">
          {loading && (
            <div className="om-loading">
              <Loader2 size={26} className="text-indigo-500 animate-spin" />
            </div>
          )}

          {/* Header */}
          <div className="om-header">
            <div className="om-header-left">
              <div className="om-icon-box"><Package size={15} /></div>
              <div>
                <div className="om-title">{cartData.customerName || '—'}</div>
                <div className="om-sub">#{shortId}</div>
              </div>
              <div className="om-status-pill" style={{ background: meta.bg, color: meta.labelColor, border: `1px solid ${meta.color}35` }}>
                <div className="om-status-dot" style={{ background: meta.color }} />
                {currentLabel}
              </div>
            </div>
            <button className="om-x" onClick={onClose}><X size={14} /></button>
          </div>

          {/* Body */}
          <div className="om-body">
            {/* Shipping */}
            <div className="om-card">
              <div className="om-card-title"><MapPin size={11} />{t('modal.section_shipping')}</div>
              <div className="om-info-row">
                <span className="om-info-label">{t('modal.customer_phone')}</span>
                <span className="om-info-val flex items-center gap-1" dir="ltr">
                  <Phone size={10} className="text-gray-400" /> {cartData.customerPhone || '—'}
                </span>
              </div>
              <div className="om-info-row">
                <span className="om-info-label">{t('modal.wilaya')}</span>
                <span className="om-info-val">{cartData.customerWilaya?.ar_name || '—'}</span>
              </div>
              <div className="om-info-row">
                <span className="om-info-label">{t('modal.commune')}</span>
                <span className="om-info-val">{cartData.customerCommune?.ar_name || '—'}</span>
              </div>
              <div className="om-info-row">
                <span className="om-info-label">{t('modal.ship_type')}</span>
                <span className="om-info-val">{cartData.typeShip === 'office' ? t('modal.ship_office') : t('modal.ship_home')}</span>
              </div>
            </div>

            {/* Products */}
            <div className="om-card">
              <div className="om-card-title">
                <Package size={11} />{t('modal.product_label')}
                <span style={{ marginInlineStart: 'auto', color: '#c0c0da', fontSize: 11, fontWeight: 600 }}>
                  {items.length}
                </span>
              </div>
              {items.map(item => (
                <div key={item.id} className="om-item-line">
                  <span className="om-item-line-name">{item.quantity}× {item.product?.name || item.productName || t('modal.product_unknown')}</span>
                  <span className="om-item-line-meta">{parseFloat(item.finalPrice || 0).toLocaleString()} DA</span>
                </div>
              ))}
              <div className="om-totals">
                <span className="om-tot-label">{t('modal.price_total')}</span>
                <span className="om-tot-val">{parseFloat(cartData.totalPrice || 0).toLocaleString()} DA</span>
              </div>
            </div>

            {/* Status */}
            <div className="om-card">
              <div className="om-card-title"><CheckCircle2 size={11} />{t('modal.status_label')}</div>
              <div className="om-status-grid">
                {statusOptions.map(o => {
                  const m = STATUS_META[o.value] || STATUS_META.pending;
                  const active = status === o.value;
                  return (
                    <button key={o.value} type="button" className="om-status-btn"
                      style={active ? { borderColor: m.color, background: m.bg, color: m.labelColor } : {}}
                      onClick={() => setStatus(o.value)}>
                      <span className="om-status-name">
                        <span className="dot" style={{ background: m.color }} />
                        {o.label}
                      </span>
                      {active && <CheckCircle2 size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="om-footer">
            <button type="button" className="om-link-full" onClick={goFull}>
              <ExternalLink size={12} /> {t('list.edit')}
            </button>
            <div className="om-footer-actions">
              <button className="om-btn-cancel" onClick={onClose}>{t('modal.close')}</button>
              <button className="om-btn-save" onClick={handleSave} disabled={loading || !hasChanges}>
                {loading ? <><Loader2 size={13} className="animate-spin" />{t('modal.saving')}</> : <><Save size={13} />{t('modal.save')}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}