import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, Download, Trash2, Edit2,
  Package, AlertTriangle, ChevronDown,
  ArrowLeft, ArrowRight,
  Loader2, X, ShoppingBag, Truck, CheckCircle2, XCircle,
  Send, CheckSquare, Square, MinusSquare, ShieldAlert,
  Phone, Copy, Check, Eye, Mail, MessageCircle,
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import OrderModal from './orderModel';
import NoStoreState from '../../../components/NoStoreState';

export const StatusEnum = {
  PENDING: 'pending', APPL1: 'appl1', APPL2: 'appl2', APPL3: 'appl3',
  CONFIRMED: 'confirmed', SHIPPING: 'shipping', CANCELLED: 'cancelled',
  RETURNED: 'returned', DELIVERED: 'delivered', POSTPONED: 'postponed',
};

/* نفس لوحة الألوان السابقة — بدون أي تغيير في الدلالة اللونية */
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

/* نقطة ملوّنة لقائمة تغيير الحالة — مشتقة من نفس الألوان أعلاه */
const STATUS_DOT = {
  pending: 'bg-amber-500', appl1: 'bg-orange-500', appl2: 'bg-orange-500', appl3: 'bg-orange-500',
  confirmed: 'bg-blue-500', shipping: 'bg-cyan-500', cancelled: 'bg-purple-500',
  returned: 'bg-rose-500', delivered: 'bg-emerald-500', postponed: 'bg-gray-400',
};

const PAGE_SIZE = 50;

/* شبكة واحدة يشترك فيها رأس الجدول وكل صف — هي سبب استقامة الأعمدة */
const GRID =
  'md:grid md:grid-cols-[28px_minmax(150px,1.25fr)_minmax(130px,1.3fr)_minmax(110px,0.9fr)_112px_128px_104px] md:items-center md:gap-3';

const truncate = (text = '', max = 20) =>
  text.length > max ? text.slice(0, max) + '…' : text;

// "تم التوصيل" لا معنى له لطلب رقمي — لا يوجد توصيل فعلي، فقط بيع. القيمة
// المخزّنة في الـ backend تبقى 'delivered' دائماً، هذا تبديل للتسمية المعروضة فقط.
const statusLabel = (t, status, isDigital) =>
  status === 'delivered' && isDigital ? t('status.delivered_digital') : t(`status.${status}`);

// لا شحن فعلي لطلب رقمي — "قيد التوصيل" و"مُرجع" لا ينطبقان عليه إطلاقاً.
const DIGITAL_HIDDEN_STATUSES = ['shipping', 'returned'];

const getStoreId = () => localStorage.getItem('storeId');

const money = (v) => parseFloat(v || 0).toLocaleString();

/* ════════════════════════════════════════════════════
   Toast — بديل alert()، ما يقطعش الخدمة
════════════════════════════════════════════════════ */
function Toasts({ items, onDismiss }) {
  return (
    <div className="fixed bottom-4 inset-x-0 z-[400] flex flex-col items-center gap-2 pointer-events-none px-4">
      {items.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border cursor-pointer max-w-sm ${
            t.type === 'error'
              ? 'bg-rose-500 text-white border-rose-600'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
          }`}
          style={{ animation: 'toastIn .18s ease' }}
        >
          {t.type === 'error' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          <span className="truncate">{t.text}</span>
        </div>
      ))}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

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

  /* إعادة محاولة الفاشلين فقط — أهم شي عملي في الشحن الجماعي */
  const retryFailed = async () => {
    const failed = results.filter(r => r.status === 'error').map(r => r.order);
    if (!failed.length) return;
    setRunning(true);
    setProgress(orders.length - failed.length);
    setResults(prev => prev.map(r => r.status === 'error' ? { ...r, status: 'pending', message: undefined } : r));
    for (let i = 0; i < failed.length; i++) {
      const order = failed[i];
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
      setProgress(orders.length - failed.length + i + 1);
      await new Promise(res => setTimeout(res, 300));
    }
    setRunning(false);
  };

  const copyTrackings = () => {
    const ids = results.filter(r => r.status === 'ok' && r.trackingId).map(r => r.trackingId).join('\n');
    if (ids) navigator.clipboard?.writeText(ids);
  };

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
          <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 shrink-0 flex gap-2">
            {errorCount > 0 && (
              <button onClick={retryFailed} className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                <RefreshCw size={14} /> {t('bulk_ship.retry_failed', { count: errorCount })}
              </button>
            )}
            {okCount > 0 && (
              <button onClick={copyTrackings} className="py-2.5 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                <Copy size={14} /> {t('bulk_ship.copy_trackings', 'نسخ أرقام التتبع')}
              </button>
            )}
            <button onClick={() => { onDone(okCount); onClose(); }} className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-bold transition-all">
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
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{money(order.totalPrice)} DA</span>
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
   Inline Status Menu — تغيير الحالة من القائمة مباشرة
════════════════════════════════════════════════════ */
function StatusCell({ cart, open, busy, onToggle, onPick, statusKeys, isRtl, t }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = e => { if (ref.current && !ref.current.contains(e.target)) onToggle(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, onToggle]);

  const style = STATUS_STYLES[cart.status] || STATUS_STYLES.pending;
  const visibleStatusKeys = cart.isDigital
    ? statusKeys.filter(k => !DIGITAL_HIDDEN_STATUSES.includes(k))
    : statusKeys;

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => onToggle(open ? null : cart.id)}
        disabled={busy}
        className={`w-full md:w-auto min-w-[112px] flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all hover:brightness-95 disabled:opacity-60 ${style}`}
      >
        <span className="truncate">{statusLabel(t, cart.status, cart.isDigital) || cart.status}</span>
        {busy ? <Loader2 size={11} className="animate-spin shrink-0" /> : <ChevronDown size={11} className="shrink-0 opacity-60" />}
      </button>

      {open && (
        <div className={`absolute z-50 top-full mt-1 w-44 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl ${isRtl ? 'left-0' : 'right-0'}`}>
          {visibleStatusKeys.map(k => (
            <button
              key={k}
              onClick={() => onPick(cart, k)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                k === cart.status
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[k]}`} />
              <span className="flex-1 text-start truncate">{statusLabel(t, k, cart.isDigital)}</span>
              {k === cart.status && <Check size={12} className="shrink-0 text-gray-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Ship Button (per row) — أيقونة فقط، النص في tooltip
════════════════════════════════════════════════════ */
function ShipButton({ order, onResult, onShipped, t }) {
  const { i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const token = getAccessToken();
  const storeId = getStoreId();

  const shipped = order.status === 'shipping' || order.shippingTrackingId;

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
      onShipped?.(order.id);
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
        title={shipped ? t('ship.shipped') : t('ship.btn')}
        onClick={e => {
          e.stopPropagation();
          if (shipped) return;
          if (!storeId) { onResult({ type: 'error', message: t('ship.no_store') }); return; }
          setShowPicker(true);
        }}
        disabled={loading || shipped}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
          shipped
            ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20 cursor-default'
            : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20 hover:bg-cyan-500 hover:text-white hover:border-cyan-500'
        } disabled:opacity-60`}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : shipped ? <CheckCircle2 size={14} /> : <Truck size={14} />}
      </button>
    </>
  );
}

/* ════════════════════════════════════════════════════
   Skeleton row — بديل شاشة التحميل الكاملة
════════════════════════════════════════════════════ */
function SkeletonRow() {
  return (
    <div className={`bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 py-3 ${GRID}`}>
      <div className="hidden md:block h-4 w-4 rounded bg-gray-100 dark:bg-zinc-800 animate-pulse" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-100 dark:bg-zinc-800 animate-pulse my-1" style={{ width: `${60 + (i * 7) % 35}%` }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════ */
export default function Orders() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState(''); // '' | 'digital' | 'physical'
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shipResult, setShipResult] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkPicker, setShowBulkPicker] = useState(false);
  const [bulkShipOrders, setBulkShipOrders] = useState(null);
  const [bulkAccountId, setBulkAccountId] = useState(null);

  const [openStatusId, setOpenStatusId] = useState(null);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const token = getAccessToken();
  const storeId = getStoreId();
  const statusKeys = Object.values(StatusEnum);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pushToast = useCallback((text, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, text, type }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000);
  }, []);

  /* بحث بتأخير 450ms — بلا ما يضغط Enter، مع بقاء Enter شغال */
  useEffect(() => {
    const id = setTimeout(() => setQuery(q => (q === searchTerm.trim() ? q : searchTerm.trim())), 450);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); setSelectedIds(new Set()); }, [query, statusFilter, typeFilter]);

  const fetchOrders = useCallback(async () => {
    if (!storeId) {
      setOrders([]); setTotal(0);
      setError(t('ship.no_store'));
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const isDigital = typeFilter === 'digital' ? true : typeFilter === 'physical' ? false : undefined;
      const [{ data }, resCount] = await Promise.all([
        axios.get(`${baseURL}/orders/${storeId}`, {
          params: { status: statusFilter, query, page: currentPage, isDigital },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/orders/count/${storeId}`, {
          params: { status: statusFilter, query, isDigital },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setOrders(Array.isArray(data) ? data : []);
      setTotal(Number(resCount.data) || 0);
    } catch (e) { console.error(e); setError(t('list.error')); }
    finally { setLoading(false); }
  }, [token, query, statusFilter, typeFilter, currentPage, storeId, t]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // منتج رقمي لا يُشحن — لا يدخل قائمة "الطلبات القابلة للشحن" إطلاقاً
  const confirmedOrders = orders.filter(c => c.status === 'confirmed' && !c.shippingTrackingId && !c.isDigital);
  const allConfirmedSelected = confirmedOrders.length > 0 && confirmedOrders.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  useEffect(() => {
    const anyModal = isOpen || !!deleteTarget || !!shipResult || showBulkPicker || !!bulkShipOrders;
    document.body.style.overflow = anyModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, deleteTarget, shipResult, showBulkPicker, bulkShipOrders]);

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

  /* تغيير الحالة بضغطة وحدة — نفس payload المستعمل في OrderModal */
  const quickStatus = async (cart, status) => {
    setOpenStatusId(null);
    if (status === cart.status) return;
    const prev = cart.status;
    setStatusBusyId(cart.id);
    setOrders(p => p.map(o => o.id === cart.id ? { ...o, status } : o));
    try {
      const dtos = (cart.items || []).map(item => ({
        status,
        productId: item.productId || item.product?.id,
        quantity: item.quantity,
        variantDetailId: item.variantDetailId ?? null,
        offerId: item.offerId ?? null,
        finalPrice: item.finalPrice,
        totalPrice: (item.finalPrice || 0) * (item.quantity || 1),
      }));
      await axios.patch(`${baseURL}/orders/${cart.id}`, dtos, {
        headers: { Authorization: `Bearer ${token}` },
      });
      pushToast(`${cart.customerName || ''} → ${statusLabel(t, status, cart.isDigital)}`);
      /* الطلب خرج من الفلتر الحالي → نحيّدو من القائمة بلا reload */
      if (statusFilter && statusFilter !== status) {
        setTimeout(() => {
          setOrders(p => p.filter(o => o.id !== cart.id));
          setTotal(x => Math.max(0, x - 1));
          setSelectedIds(s => { const n = new Set(s); n.delete(cart.id); return n; });
        }, 400);
      }
    } catch (e) {
      console.error(e);
      setOrders(p => p.map(o => o.id === cart.id ? { ...o, status: prev } : o));
      pushToast(t('modal.save_failed', 'فشل حفظ التغييرات'), 'error');
    } finally { setStatusBusyId(null); }
  };

  const copyPhone = (cart) => {
    navigator.clipboard?.writeText(cart.customerPhone || '');
    setCopiedId(cart.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportToExcel = useCallback(() => {
    if (!orders.length) { pushToast(t('list.no_export'), 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(orders.map(order => ({
      [t('export.customer_name')]: order.customerName || '',
      [t('export.phone')]: order.customerPhone || '',
      [t('export.customer_email')]: order.customerEmail || '',
      [t('export.customer_whatsapp')]: order.customerWhatsapp || '',
      [t('export.type')]: order.isDigital ? t('export.digital') : t('export.physical'),
      [t('export.product')]: (order.items || []).map(i => `${i.quantity}x ${i.product?.name || ''}`).join(' | '),
      [t('export.wilaya')]: order.customerWilaya?.ar_name || '',
      [t('export.commune')]: order.customerCommune?.ar_name || '',
      [t('export.ship_type')]: order.typeShip === 'office' ? t('export.ship_office') : t('export.ship_home'),
      [t('export.ship_price')]: parseFloat(order.priceShip || 0),
      [t('export.total')]: parseFloat(order.totalPrice || 0),
      [t('export.status')]: statusLabel(t, order.status, order.isDigital) || order.status,
    })));
    ws['!cols'] = Array(9).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('export.sheet_name'));
    XLSX.writeFile(wb, t('export.filename', { date: new Date().toISOString().split('T')[0] }));
  }, [orders, t, pushToast]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${baseURL}/orders/${deleteTarget.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      setTotal(x => Math.max(0, x - 1));
      setDeleteTarget(null);
      pushToast(t('delete_modal.done', 'تم حذف الطلب'));
    } catch (e) { console.error(e); pushToast(t('delete_modal.failed'), 'error'); }
    finally { setDeleting(false); }
  };

  const openModal = (cart) => { setSelectedCart(cart); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setSelectedCart(null); };

  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  if (!storeId) {
    return <NoStoreState title={t('no_store_page.title')} subtitle={t('no_store_page.subtitle')} cta={t('no_store_page.cta')} isRtl={isRtl} />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>

      <Toasts items={toasts} onDismiss={id => setToasts(p => p.filter(x => x.id !== id))} />

      {showBulkPicker && (
        <AccountPickerModal
          storeId={storeId} token={token} isRtl={isRtl} t={t}
          subtitle={t('bulk_ship.button_ship_selected', { count: selectedIds.size })}
          onClose={() => { setShowBulkPicker(false); setBulkShipOrders(null); }}
          onSelect={acc => { setShowBulkPicker(false); setBulkAccountId(acc.id); }}
        />
      )}

      {bulkShipOrders && bulkAccountId && !showBulkPicker && (
        <BulkShipModal
          orders={bulkShipOrders} accountId={bulkAccountId} token={token} storeId={storeId} t={t}
          onClose={() => { setBulkShipOrders(null); setBulkAccountId(null); }}
          onDone={okCount => { clearSelection(); if (okCount > 0) fetchOrders(); }}
        />
      )}

      <ShipResultModal result={shipResult} onClose={() => setShipResult(null)} />
      <DeleteConfirmModal order={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} deleting={deleting} />

      {/* ═══ شريط أدوات ثابت: البحث + الفلاتر ديما تحت العين ═══ */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

          {/* صف 1 */}
          <div className="flex items-center gap-3 py-3">
            <div className="hidden sm:flex p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl shrink-0">
              <ShoppingBag size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="hidden lg:block shrink-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{t('list.title')}</h1>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">{total} {t('list.orders_word', 'طلب')}</p>
            </div>

            <div className="relative flex-1 min-w-0">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} size={16} />
              <input
                type="text" value={searchTerm} placeholder={t('list.search_placeholder')}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setQuery(searchTerm.trim()); if (e.key === 'Escape') { setSearchTerm(''); setQuery(''); } }}
                className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-400 dark:text-white transition-all ${isRtl ? 'pr-10 pl-9' : 'pl-10 pr-9'}`}
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setQuery(''); }}
                  className={`absolute top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 ${isRtl ? 'left-2' : 'right-2'}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button onClick={exportToExcel} disabled={!orders.length} title={t('list.export_excel')}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-40">
              <Download size={16} />
            </button>
            <button onClick={fetchOrders} title={t('list.retry')}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* صف 2: تبويبات الحالة — ضغطة وحدة بدل select */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 -mx-1 px-1 scrollbar-none">
            {[{ key: '', label: t('list.all_short', 'الكل') }, ...statusKeys.map(k => ({ key: k, label: t(`status.${k}`) }))].map(tab => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key || 'all'}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                      : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {tab.key && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/80' : STATUS_DOT[tab.key]}`} />}
                  {tab.label}
                  {active && <span className="text-[10px] font-black opacity-80">{total}</span>}
                </button>
              );
            })}
          </div>

          {/* صف 3: فصل الطلبات الرقمية عن العادية */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl w-fit">
            {[
              { key: '', label: t('list.type_all', 'الكل') },
              { key: 'physical', label: t('list.type_physical', 'عادي') },
              { key: 'digital', label: t('list.type_digital', 'رقمي') },
            ].map(tab => (
              <button
                key={tab.key || 'all-types'}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${typeFilter === tab.key
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ الجدول ═══ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-visible">

          {/* رأس الجدول */}
          <div className={`hidden md:grid ${GRID} px-4 py-2.5 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/40 rounded-t-2xl`}>
            <button
              onClick={toggleSelectAll}
              disabled={!confirmedOrders.length}
              title={t('bulk_ship.button_select_all', { count: confirmedOrders.length })}
              className="flex items-center justify-center disabled:opacity-30"
            >
              {allConfirmedSelected
                ? <CheckSquare size={16} className="text-cyan-500" />
                : someSelected
                  ? <MinusSquare size={16} className="text-cyan-400" />
                  : <Square size={16} className="text-gray-300 dark:text-zinc-600" />}
            </button>
            {[t('list.col_customer', 'الزبون'), t('list.col_products', 'المنتجات'), t('list.col_destination', 'الوجهة'), t('list.col_total', 'المبلغ'), t('list.col_status', 'الحالة'), t('list.col_actions', 'إجراءات')].map(h => (
              <span key={h} className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">{h}</span>
            ))}
          </div>

          {/* الصفوف */}
          {loading ? (
            [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertTriangle size={32} className="text-rose-400" />
              <p className="text-sm font-bold text-rose-500">{error}</p>
              <button onClick={fetchOrders} className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90">{t('list.retry')}</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={36} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">{t('list.no_orders')}</p>
              {(query || statusFilter || typeFilter) && (
                <button onClick={() => { setSearchTerm(''); setQuery(''); setStatusFilter(''); setTypeFilter(''); }}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700">
                  {t('list.clear_filters', 'مسح الفلاتر')}
                </button>
              )}
            </div>
          ) : orders.map((cart, i) => {
            const isSelected = selectedIds.has(cart.id);
            const isSuspicious = !cart.customerId;
            const items = cart.items || [];
            const selectable = cart.status === 'confirmed' && !cart.shippingTrackingId && !cart.isDigital;

            return (
              <div
                key={cart.id}
                onDoubleClick={() => openModal(cart)}
                className={`${GRID} px-4 py-3 border-b border-gray-50 dark:border-zinc-800/60 last:border-b-0 transition-colors flex flex-col gap-3 md:gap-3 ${
                  isSelected
                    ? 'bg-cyan-50/50 dark:bg-cyan-500/5'
                    : isSuspicious
                      ? 'bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50/60'
                      : 'hover:bg-gray-50/70 dark:hover:bg-zinc-800/40'
                }`}
              >
                {/* تحديد */}
                <div className="hidden md:flex items-center justify-center">
                  {selectable ? (
                    <button onClick={e => { e.stopPropagation(); toggleSelect(cart.id); }}>
                      {isSelected
                        ? <CheckSquare size={16} className="text-cyan-500" />
                        : <Square size={16} className="text-gray-300 dark:text-zinc-600 hover:text-cyan-400 transition-colors" />}
                    </button>
                  ) : <span className="text-[10px] text-gray-300 dark:text-zinc-700 font-bold tabular-nums">{(currentPage - 1) * PAGE_SIZE + i + 1}</span>}
                </div>

                {/* الزبون + الهاتف */}
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* موبايل: التحديد جنب الاسم */}
                    {selectable && (
                      <button onClick={e => { e.stopPropagation(); toggleSelect(cart.id); }} className="md:hidden shrink-0">
                        {isSelected ? <CheckSquare size={15} className="text-cyan-500" /> : <Square size={15} className="text-gray-300" />}
                      </button>
                    )}
                    <span className="font-bold text-gray-900 dark:text-white text-sm truncate">{cart.customerName || '—'}</span>
                    {isSuspicious && (
                      <span title={t('list.suspicious', 'مشتبه')} className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[9px] font-bold border border-amber-200 dark:border-amber-500/30">
                        <ShieldAlert size={9} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${cart.customerPhone}`}
                      onClick={e => e.stopPropagation()}
                      dir="ltr"
                      className="text-[13px] text-indigo-600 dark:text-indigo-400 font-semibold tabular-nums hover:underline flex items-center gap-1"
                    >
                      <Phone size={11} className="opacity-60" />{cart.customerPhone}
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); copyPhone(cart); }}
                      title={t('list.copy_phone', 'نسخ الرقم')}
                      className="p-1 rounded text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      {copiedId === cart.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setSearchTerm(cart.customerPhone || ''); }}
                      title={t('list.search_by_phone', 'بحث بهذا الرقم')}
                      className="p-1 rounded text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      <Search size={11} />
                    </button>
                  </div>
                </div>

                {/* المنتجات */}
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="text-[13px] text-gray-700 dark:text-zinc-300 font-medium truncate" title={items.map(it => `${it.quantity}× ${it.product?.name || ''}`).join(' • ')}>
                    {items[0] ? `${items[0].quantity}× ${truncate(items[0].product?.name || '', 26)}` : '—'}
                  </span>
                  {items.length > 1 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded w-fit">
                      <ShoppingBag size={9} /> +{items.length - 1} {t('list.more_items', 'منتج')}
                    </span>
                  )}
                </div>

                {/* الوجهة */}
                <div className="min-w-0 flex flex-col gap-0.5">
                  {cart.isDigital ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-800 dark:text-zinc-200 truncate">
                        {cart.customerWhatsapp
                          ? <MessageCircle size={11} className="opacity-60 shrink-0" />
                          : <Mail size={11} className="opacity-60 shrink-0" />}
                        <span className="truncate" dir="ltr">{cart.customerWhatsapp || cart.customerEmail || '—'}</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 text-[9px] font-bold border border-violet-200 dark:border-violet-500/30 w-fit">
                        {t('list.digital_badge', 'رقمي')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold text-gray-800 dark:text-zinc-200 truncate">{cart.customerWilaya?.ar_name || '—'}</span>
                      <span className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">
                        {cart.customerCommune?.ar_name || '—'}
                        <span className="mx-1 text-gray-300 dark:text-zinc-700">·</span>
                        {cart.typeShip === 'office' ? t('list.ship_office') : t('list.ship_home')}
                      </span>
                    </>
                  )}
                </div>

                {/* المبلغ */}
                <div className={`flex md:flex-col ${isRtl ? 'md:items-start' : 'md:items-start'} items-center justify-between md:justify-center gap-1`}>
                  <span dir="ltr" className="text-[15px] font-black text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
                    {money(cart.totalPrice)} DA
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums">
                    {t('list.ship_fee', { price: money(cart.priceShip) })}
                  </span>
                </div>

                {/* الحالة */}
                <StatusCell
                  cart={cart}
                  open={openStatusId === cart.id}
                  busy={statusBusyId === cart.id}
                  onToggle={setOpenStatusId}
                  onPick={quickStatus}
                  statusKeys={statusKeys}
                  isRtl={isRtl}
                  t={t}
                />

                {/* إجراءات — أيقونات مضغوطة */}
                <div className="flex items-center gap-1.5 md:justify-end" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openModal(cart)}
                    title={t('list.quick_view', 'عرض سريع')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/orders/${cart.id}`)}
                    title={t('list.edit')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  {!cart.isDigital && (
                    <ShipButton order={cart} onResult={setShipResult} onShipped={() => fetchOrders()} t={t} />
                  )}
                  <button
                    onClick={() => setDeleteTarget(cart)}
                    title={t('list.delete')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-400 border border-rose-100 dark:border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Pagination ═══ */}
        {!loading && !error && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium tabular-nums">
              {t('list.range', { from, to, total, defaultValue: `${from}–${to} من ${total}` })}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ArrowLeft size={14} className={isRtl ? 'rotate-180' : ''} /> {t('list.prev_page')}
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                    .map((p, idx) => p === '…'
                      ? <span key={`dot-${idx}`} className="px-1.5 text-gray-400 text-sm font-bold select-none">…</span>
                      : <button key={p} onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-black tabular-nums transition-all border ${currentPage === p
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                          : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>{p}</button>
                    )}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {t('list.next_page')} <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ شريط الإجراءات الجماعية — يطلع كي تحدد ═══ */}
      {someSelected && (
        <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900 dark:bg-white shadow-2xl border border-gray-800 dark:border-gray-200"
            style={{ animation: 'barUp .2s ease' }}>
            <span className="text-sm font-black text-white dark:text-gray-900 tabular-nums shrink-0">
              {selectedIds.size}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-1 truncate">
              {t('bulk_ship.selected_count', 'محدد')}
            </span>
            <button onClick={toggleSelectAll} className="text-xs font-bold text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 px-2 py-1.5 transition-colors shrink-0">
              {allConfirmedSelected ? t('bulk_ship.clear_selection') : t('bulk_ship.button_select_all', { count: confirmedOrders.length })}
            </button>
            <button onClick={clearSelection} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 dark:hover:bg-black/10 transition-colors shrink-0">
              <X size={15} />
            </button>
            <button onClick={startBulkShip}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 shrink-0">
              <Send size={14} /> {t('bulk_ship.button_ship_selected', { count: selectedIds.size })}
            </button>
          </div>
          <style>{`@keyframes barUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}

      <OrderModal isOpen={isOpen} onClose={closeModal} cartData={selectedCart} onRefresh={fetchOrders} />

      <style>{`.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}