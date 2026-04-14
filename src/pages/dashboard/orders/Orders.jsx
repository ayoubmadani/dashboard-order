import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom'; // استيراد الهوك
import {
  Search, RefreshCw, Download, Trash2, Edit2,
  Package, AlertTriangle, ChevronDown,
  ArrowLeft, ArrowRight,
  Loader2, X, ShoppingBag, Truck, CheckCircle2, XCircle,
  Send, CheckSquare, Square, MinusSquare,
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import OrderModal from './orderModel';
import Loading from '../../../components/Loading';

export const StatusEnum = {
  PENDING: 'pending', APPL1: 'appl1', APPL2: 'appl2', APPL3: 'appl3',
  CONFIRMED: 'confirmed', SHIPPING: 'shipping', CANCELLED: 'cancelled',
  RETURNED: 'returned', DELIVERED: 'delivered', POSTPONED: 'postponed',
};

const STATUS_STYLES = {
  pending: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  appl1: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  appl2: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  appl3: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  confirmed: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  shipping: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
  cancelled: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
  returned: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
  delivered: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  postponed: 'text-gray-500 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700',
};

const truncate = (text = '', max = 20) =>
  text.length > max ? text.slice(0, max) + '…' : text;

const getStoreId = () => localStorage.getItem('storeId');


/* ════════════════════════════════════════════════════
   Account Picker Modal
════════════════════════════════════════════════════ */
function AccountPickerModal({ storeId, token, isRtl, subtitle, onSelect, onClose, t }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${baseURL}/stores/${storeId}/shipping/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(r => setAccounts(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
        style={{ animation: 'zoomIn .18s ease' }}
      >
        <div className="h-1 bg-cyan-500" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
                <Truck size={15} className="text-cyan-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{t('account_picker.title')}</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">{subtitle ?? t('account_picker.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-cyan-400" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-10 space-y-1">
                <Truck size={28} className="mx-auto text-gray-300 dark:text-zinc-600" />
                <p className="text-sm text-gray-400 dark:text-zinc-500 font-medium">{t('account_picker.empty_title')}</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-600">{t('account_picker.empty_subtitle')}</p>
              </div>
            ) : accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => onSelect(acc)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:border-cyan-400 hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10 text-${isRtl ? 'right' : 'left'} ${acc.isDefault
                  ? 'border-cyan-400 bg-cyan-50/60 dark:bg-cyan-500/10'
                  : 'border-gray-100 dark:border-zinc-700'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${acc.isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}>
                  <Truck size={14} className={acc.isVerified ? 'text-emerald-500' : 'text-amber-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{acc.accountName}</p>
                    {acc.isDefault && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 shrink-0">
                        {t('account_picker.default_badge')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">{acc.providerName}</p>
                </div>
                {acc.isVerified
                  ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  : <XCircle size={14} className="text-amber-400 shrink-0" />
                }
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Bulk Ship Progress Modal
════════════════════════════════════════════════════ */
function BulkShipModal({ orders, accountId, token, storeId, onClose, onDone, t }) {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setResults(orders.map(o => ({ order: o, status: 'pending' })));
    (async () => {
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        try {
          const { data } = await axios.post(
            `${baseURL}/stores/${storeId}/shipping/orders`,
            { orderData: { orderId: order.id }, accountId },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const trackingId = data?.tracking ?? data?.Tracking ?? data?.tracking_id ?? data?.id ?? null;
          setResults(prev => prev.map(r => r.order.id === order.id ? { ...r, status: 'ok', trackingId } : r));
        } catch (err) {
          const message = err.response?.data?.message ?? err.response?.data?.error ?? t('bulk_ship.failed');
          setResults(prev => prev.map(r => r.order.id === order.id ? { ...r, status: 'error', message } : r));
        }
        setProgress(i + 1);
        await new Promise(res => setTimeout(res, 300));
      }
      setRunning(false);
    })();
  }, []);

  const okCount = results.filter(r => r.status === 'ok').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const pct = orders.length ? Math.round((progress / orders.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh]"
        style={{ animation: 'zoomIn .18s ease' }}
      >
        <div className="h-1 bg-cyan-500" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
                <Send size={14} className="text-cyan-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{t('bulk_ship.title')}</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                  {running
                    ? t('bulk_ship.status_running', { progress, total: orders.length })
                    : t('bulk_ship.status_complete', { okCount, errorCount })}
                </p>
              </div>
            </div>
            {!running && (
              <button onClick={() => { onDone(okCount); onClose(); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
                <X size={15} />
              </button>
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-2 rounded-full bg-cyan-500 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-1 font-medium">
            <span className="text-emerald-500 font-bold">{okCount} {t('bulk_ship.success')}</span>
            <span>{pct}%</span>
            {errorCount > 0 && <span className="text-rose-500 font-bold">{errorCount} {t('bulk_ship.failed')}</span>}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
          {results.map(({ order, status, trackingId, message }) => (
            <div key={order.id} className="flex items-center gap-3 px-5 py-3">
              <div className="shrink-0">
                {status === 'pending' && <Loader2 size={16} className="animate-spin text-gray-300 dark:text-zinc-600" />}
                {status === 'ok' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {status === 'error' && <XCircle size={16} className="text-rose-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{order.customerName}</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">
                  {truncate(order.items?.[0]?.product?.name || '', 30)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {status === 'ok' && trackingId && (
                  <p className="text-[11px] font-bold text-indigo-500 select-all">{trackingId}</p>
                )}
                {status === 'error' && (
                  <p className="text-[11px] text-rose-500 font-medium max-w-[120px] truncate" title={message}>{message}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {!running && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
            <button onClick={() => { onDone(okCount); onClose(); }} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-bold transition-all">
              {t('bulk_ship.close')}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Ship Result Modal (single)
════════════════════════════════════════════════════ */
function ShipResultModal({ result, onClose }) {
  const { t } = useTranslation('translation', { keyPrefix: 'orders' });
  if (!result) return null;
  const isSuccess = result.type === 'success';
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800" style={{ animation: 'zoomIn .18s ease' }}>
        <div className={`h-1 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-500/20'}`}>
            {isSuccess ? <CheckCircle2 size={26} className="text-emerald-500" /> : <XCircle size={26} className="text-rose-500" />}
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              {isSuccess ? t('ship.success_title') : t('ship.error_title')}
            </h3>
            {result.trackingId && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                {t('ship.tracking')}: <span className="font-bold text-indigo-500 select-all">{result.trackingId}</span>
              </p>
            )}
            {result.message && <p className="text-xs text-rose-500 mt-1 font-medium">{result.message}</p>}
          </div>
          <button onClick={onClose} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300'}`}>
            {t('ship.close')}
          </button>
        </div>
      </div>
      <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Delete Confirm Modal
════════════════════════════════════════════════════ */
function DeleteConfirmModal({ order, onConfirm, onCancel, deleting }) {
  const { t } = useTranslation('translation', { keyPrefix: 'orders' });
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-rose-100 dark:border-rose-900/20" style={{ animation: 'zoomIn .18s ease' }}>
        <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-400" />
        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-500/20 flex items-center justify-center">
              <Trash2 size={24} className="text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('delete_modal.title')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{t('delete_modal.irreversible')}</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-zinc-700 text-sm">
            {[
              { label: t('delete_modal.customer'), value: order.customerName },
              { label: t('delete_modal.phone'), value: order.customerPhone, blue: true },
              { label: t('delete_modal.product'), value: order.items?.map(i => i.product?.name).filter(Boolean).join(', ') },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">{row.label}</span>
                <span className={`font-bold truncate max-w-[160px] ${row.blue ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>{row.value || '—'}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-zinc-700">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">{t('delete_modal.total')}</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{parseFloat(order.totalPrice || 0).toLocaleString()} DA</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={deleting} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">{t('delete_modal.cancel')}</button>
            <button onClick={onConfirm} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all shadow-lg shadow-rose-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {deleting ? <><Loader2 size={16} className="animate-spin" />{t('delete_modal.deleting')}</> : <><Trash2 size={16} />{t('delete_modal.confirm')}</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Ship Button (per row)
════════════════════════════════════════════════════ */
function ShipButton({ order, onResult, t }) {
  const { i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const token = getAccessToken();
  const storeId = getStoreId();

  if (order.status === 'shipping' || order.shippingTrackingId) {
    return (
      <div className="px-2 py-0.5 flex items-center gap-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[11px] font-bold border border-cyan-100 dark:border-cyan-500/20">
        <Truck size={12} /> {t('ship.shipped')}
      </div>
    );
  }

  const doShip = async (accountId) => {
    setShowPicker(false);
    if (!storeId) { onResult({ type: 'error', message: t('ship.no_store') }); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${baseURL}/stores/${storeId}/shipping/orders`,
        { orderData: { orderId: order.id }, accountId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const trackingId = data?.tracking ?? data?.Tracking ?? data?.tracking_id ?? data?.id ?? null;
      onResult({ type: 'success', trackingId });
    } catch (err) {
      const message = err.response?.data?.message ?? err.response?.data?.error ?? t('ship.generic_error');
      onResult({ type: 'error', message });
    } finally { setLoading(false); }
  };

  return (
    <>
      {showPicker && (
        <AccountPickerModal
          storeId={storeId} token={token} isRtl={isRtl} t={t}
          onClose={() => setShowPicker(false)}
          onSelect={acc => doShip(acc.id)}
        />
      )}
      <button
        onClick={e => { e.stopPropagation(); setShowPicker(true); }}
        disabled={loading}
        className="px-5 md:px-1.5 py-0.5 cursor-pointer flex justify-center items-center gap-2 font-bold rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
        <span>{loading ? t('ship.sending') : t('ship.btn')}</span>
      </button>
    </>
  );
}

// ... (نفس الـ Imports و الـ Styles السابقة)

/* ════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════ */
export default function Orders() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]); // ستحتوي الآن على مجموعات (Grouped Carts)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const PAGE_SIZE = 50;

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shipResult, setShipResult] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkPicker, setShowBulkPicker] = useState(false);
  const [bulkShipOrders, setBulkShipOrders] = useState(null);
  const [bulkAccountId, setBulkAccountId] = useState(null);

  const token = getAccessToken();
  const storeId = getStoreId();
  const statusKeys = Object.values(StatusEnum);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${baseURL}/orders/${storeId}`, {
        params: { status: statusFilter, query, page: currentPage },
        headers: { Authorization: `Bearer ${token}` },
      });
      const resCount = await axios.get(`${baseURL}/orders/count/${storeId}`, {
        params: { status: statusFilter, query },
        headers: { Authorization: `Bearer ${token}` },
      });

      // البيانات القادمة هي الآن المصفوفة المجمعة (Grouped Array)      
      console.log(data);

      setOrders(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(resCount.data / PAGE_SIZE));
    } catch (e) { console.error(e); setError(t('list.error')); }
    finally { setLoading(false); }
  }, [token, query, statusFilter, currentPage, storeId, t]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // تعديل منطق الفلترة للطلبات القابلة للشحن (بناءً على أول عنصر في السلة)
  const confirmedOrders = orders.filter(cart => cart.status === 'confirmed');
  const allConfirmedSelected = confirmedOrders.length > 0 && confirmedOrders.every(cart => selectedIds.has(cart.id));
  const someSelected = selectedIds.size > 0;

  useEffect(() => {
    const anyModal = isOpen || !!deleteTarget || !!shipResult || showBulkPicker || !!bulkShipOrders;
    document.body.style.overflow = anyModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, deleteTarget, shipResult, showBulkPicker, bulkShipOrders]);

  const filtered = orders;

  const toggleSelect = (id) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () =>
    allConfirmedSelected
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(confirmedOrders.map(o => o.id)));

  const clearSelection = () => setSelectedIds(new Set());

  const startBulkShip = () => {
    if (!selectedIds.size) return;
    setBulkShipOrders(confirmedOrders.filter(o => selectedIds.has(o.id)));
    setShowBulkPicker(true);
  };

  const exportToExcel = useCallback(() => {
    if (!filtered.length) { alert(t('list.no_export')); return; }
    const ws = XLSX.utils.json_to_sheet(filtered.map(order => ({
      [t('export.customer_name')]: order.customerName || '',
      [t('export.phone')]: order.customerPhone || '',
      [t('export.product')]: order.items.map(i => `${i.quantity}x ${i.product?.name || ''}`).join(' | '),
      [t('export.wilaya')]: order.customerWilaya?.ar_name || '',
      [t('export.commune')]: order.customerCommune?.ar_name || '',
      [t('export.ship_type')]: order.typeShip === 'office' ? t('export.ship_office') : t('export.ship_home'),
      [t('export.ship_price')]: parseFloat(order.priceShip || 0),
      [t('export.total')]: parseFloat(order.totalPrice || 0),
      [t('export.status')]: t(`status.${order.status}`) || order.status,
    })));
    ws['!cols'] = Array(9).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('export.sheet_name'));
    XLSX.writeFile(wb, t('export.filename', { date: new Date().toISOString().split('T')[0] }));
  }, [filtered, t]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${baseURL}/orders/${deleteTarget.cartId}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) { console.error(e); alert(t('delete_modal.failed')); }
    finally { setDeleting(false); }
  };

  const openModal = (cart) => { setSelectedCart(cart); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setSelectedCart(null); };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const paginated = orders;

  if (loading) return <Loading />;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <AlertTriangle size={40} className="text-rose-400" />
      <p className="text-sm font-bold text-rose-500">{error}</p>
      <button onClick={fetchOrders} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">{t('list.retry')}</button>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50/50 dark:bg-zinc-950 font-sans ${isOpen || deleteTarget || shipResult || showBulkPicker || bulkShipOrders ? 'overflow-hidden h-screen' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Bulk account picker */}
      {showBulkPicker && (
        <AccountPickerModal
          storeId={storeId} token={token} isRtl={isRtl} t={t}
          subtitle={t('bulk_ship.button_ship_selected', { count: selectedIds.size })}
          onClose={() => setShowBulkPicker(false)}
          onSelect={acc => { setShowBulkPicker(false); setBulkAccountId(acc.id); }}
        />
      )}

      {/* Bulk progress */}
      {bulkShipOrders && bulkAccountId && !showBulkPicker && (
        <BulkShipModal
          orders={bulkShipOrders} accountId={bulkAccountId} token={token} storeId={storeId} t={t}
          onClose={() => { setBulkShipOrders(null); setBulkAccountId(null); }}
          onDone={okCount => { clearSelection(); if (okCount > 0) fetchOrders(); }}
        />
      )}

      <ShipResultModal result={shipResult} onClose={() => setShipResult(null)} />
      <DeleteConfirmModal order={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} deleting={deleting} />

      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col gap-5">

            <div className="flex items-center gap-4 flex-1">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                <ShoppingBag size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('list.title')}</h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('list.subtitle')}</p>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
              <div className="relative w-full xl:max-w-sm">
                <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} size={17} />
                <input type="text" value={searchTerm} placeholder={t('list.search_placeholder')}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setQuery(searchTerm)}
                  className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-400 dark:text-white transition-all ${isRtl ? 'pr-11 pl-24' : 'pl-11 pr-24'}`}
                />
                <button onClick={() => setQuery(searchTerm)} className={`absolute top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all ${isRtl ? 'left-1.5' : 'right-1.5'}`}>
                  {t('list.search_btn')}
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 cursor-pointer min-w-[180px]">
                    <option value="">{t('list.all_statuses', { count: orders.length })}</option>
                    {statusKeys.map(val => <option key={val} value={val}>{t(`status.${val}`)}</option>)}
                  </select>
                  <ChevronDown size={14} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${isRtl ? 'left-3' : 'right-3'}`} />
                </div>

                <div className="w-px h-7 bg-gray-200 dark:bg-zinc-700 hidden md:block" />

                {/* ── Bulk ship button ── */}
                {confirmedOrders.length > 0 && (
                  <button
                    onClick={someSelected ? startBulkShip : toggleSelectAll}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${someSelected
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20'
                      : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20 hover:bg-cyan-500 hover:text-white hover:border-cyan-500'
                      }`}
                  >
                    {someSelected
                      ? <><Send size={14} /> {t('bulk_ship.button_ship_selected', { count: selectedIds.size })}</>
                      : <><Truck size={14} /> {t('bulk_ship.button_select_all', { count: confirmedOrders.length })}</>
                    }
                  </button>
                )}

                {someSelected && (
                  <button onClick={clearSelection} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all border border-gray-200 dark:border-zinc-700">
                    <X size={13} /> {t('bulk_ship.clear_selection')}
                  </button>
                )}

                <div className="w-px h-7 bg-gray-200 dark:bg-zinc-700 hidden md:block" />

                <button onClick={exportToExcel} disabled={filtered.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all disabled:opacity-40">
                  <Download size={15} /> {t('list.export_excel')}
                </button>

                <button onClick={() => { setQuery(''); setSearchTerm(''); fetchOrders(); }}
                  className="p-2.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all">
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>

            {query && (
              <button onClick={() => { setQuery(''); setSearchTerm(''); fetchOrders(); }}
                className="max-w-[170px] flex justify-between items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-full text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">
                <span className="max-w-[140px] truncate">{t('list.search_tag', { query })}</span>
                <X size={13} />
              </button>
            )}
          </div>

          {/* ── Bulk selection bar ── */}
          {confirmedOrders.length > 0 && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50/60 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                {allConfirmedSelected
                  ? <CheckSquare size={16} className="text-blue-500" />
                  : selectedIds.size > 0
                    ? <MinusSquare size={16} className="text-blue-400" />
                    : <Square size={16} className="text-blue-300 dark:text-blue-700" />
                }
                {allConfirmedSelected ? t('bulk_ship.clear_selection') : t('bulk_ship.button_select_all', { count: confirmedOrders.length })}
              </button>
              {someSelected && <span className="text-[11px] text-blue-500 dark:text-blue-400 font-medium">{selectedIds.size} {t('bulk_ship.selected_count', 'selected')}</span>}
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mt-3">
            {t('list.results_count', { filtered: currentPage, total: totalPages })}
            {statusFilter && <span className="text-indigo-500 font-bold"> {t('list.active_filter', { status: t(`status.${statusFilter}`) })}</span>}
          </p>
        </div>
      </div>

      {/* ── Orders List ── */}
      <div className="max-w-[1400px] mx-auto py-6 space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-14 text-center">
            <Package size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">{t('list.no_orders')}</p>
          </div>
        ) : orders.map((cart, i) => {
          const statusStyle = STATUS_STYLES[cart.status] || STATUS_STYLES.pending;
          const isSelected = selectedIds.has(cart.id);

          return (
            <div
              key={cart.id}
              onDoubleClick={() => openModal(cart)}
              className={`${isRtl ? 'pl-7' : 'pr-7'} group relative bg-white dark:bg-zinc-900 rounded-2xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-sm transition-all cursor-default ${isSelected
                ? 'border-cyan-400 dark:border-cyan-500 shadow-sm shadow-cyan-500/10'
                : 'border-gray-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                }`}
            >
              {/* Checkbox */}
              {cart.status === 'confirmed' && (
                <button onClick={e => { e.stopPropagation(); toggleSelect(cart.id); }} className="shrink-0 self-start md:self-center">
                  {isSelected
                    ? <CheckSquare size={18} className="text-cyan-500" />
                    : <Square size={18} className="text-gray-300 dark:text-zinc-600 hover:text-cyan-400 transition-colors" />
                  }
                </button>
              )}

              {/* Customer Info */}
              <div className="flex flex-col w-full md:w-1/4 gap-0.5">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {truncate(`${cart.customerName || '—'}`)}
                  <span className="text-[10px] text-gray-400 font-normal ml-2">#{(currentPage - 1) * PAGE_SIZE + i + 1}</span>
                </span>
                <span role="button" onClick={e => { e.stopPropagation(); setQuery(cart.customerPhone); }} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">
                  {cart.customerPhone}
                </span>
                {cart.items.length > 1 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded w-fit">
                    <ShoppingBag size={10} /> {cart.items.length} منتجات
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="flex flex-col w-full md:w-1/5 gap-0.5">
                <span className="font-semibold text-sm text-gray-800 dark:text-zinc-200">{cart.customerWilaya?.ar_name || '—'}</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{cart.customerCommune?.ar_name || '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">{cart.typeShip === 'office' ? t('list.ship_office') : t('list.ship_home')}</span>
              </div>

              {/* Price + Status */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 border-gray-100 dark:border-zinc-800 pt-3 md:pt-0">
                <div className={`flex flex-col ${isRtl ? 'items-start' : 'items-end'}`}>
                  {/* استخدام السعر الإجمالي للسلة */}
                  <span dir="ltr" className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {parseFloat(cart.totalPrice || 0).toLocaleString()} DA
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    {t('list.ship_fee', { price: parseFloat(cart.priceShip || 0).toLocaleString() })}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyle}`}>
                  {t(`status.${cart.status}`) || cart.status}
                </span>
              </div>

              {/* Actions */}
              {/* onClick={e => { e.stopPropagation(); openModal(cart); }} */}
              <div className="flex md:flex-col gap-2">
                <button
                  onClick={() => navigate(`/dashboard/orders/${cart.id}`)} // تعديل هنا
                  className="px-5 md:px-1.5 py-0.5 cursor-pointer flex justify-center items-center gap-2 font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >                  <Edit2 size={14} /> <span>{t('list.edit')}</span>
                </button>
                <ShipButton order={cart} onResult={setShipResult} t={t} />
                <button onClick={e => { e.stopPropagation(); setDeleteTarget(cart); }} className="px-5 md:px-1.5 py-0.5 cursor-pointer flex justify-center items-center gap-2 font-bold rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <Trash2 size={14} /> <span>{t('list.delete')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="max-w-[1400px] mx-auto px-6 pb-8 flex items-center justify-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {isRtl ? <ArrowLeft size={16} className="rotate-180" /> : <ArrowLeft size={16} />} {t('list.prev_page')}
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
              .map((p, i) => p === '…'
                ? <span key={`dot-${i}`} className="px-2 text-gray-400 text-sm font-bold select-none">…</span>
                : <button key={p} onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-xl text-sm font-black transition-all border ${currentPage === p ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md' : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>{p}</button>
              )}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {t('list.next_page')} {isRtl ? <ArrowRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
          </button>
        </div>
      )}

      <OrderModal isOpen={isOpen} onClose={closeModal} cartData={selectedCart} onRefresh={fetchOrders} />    </div>
  );
}