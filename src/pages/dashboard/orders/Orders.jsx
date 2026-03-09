import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Search, RefreshCw, Download, Trash2, Edit2,
  Package, AlertTriangle, ChevronDown,
  ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight,
  Loader2, X, ShoppingBag
} from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import OrderModal from './orderModel';

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
  cancelled: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
  returned: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
  delivered: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  postponed: 'text-gray-500 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700',
};

const truncate = (text = '', max = 20) =>
  text.length > max ? text.slice(0, max) + '…' : text;

const getStoreId = () => localStorage.getItem('storeId');

/* ════════════════════════════════════════════════════
   Delete Confirm Modal
════════════════════════════════════════════════════ */
function DeleteConfirmModal({ order, onConfirm, onCancel, deleting }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-rose-100 dark:border-rose-900/20"
        style={{ animation: 'zoomIn .18s ease' }}>
        <div className="h-1 bg-gradient-to-r from-rose-500 to-rose-400" />

        <div className="p-6 space-y-5">
          {/* Icon + title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-500/20 flex items-center justify-center">
              <Trash2 size={24} className="text-rose-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('delete_modal.title')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{t('delete_modal.irreversible')}</p>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-zinc-700 text-sm">
            {[
              { label: t('delete_modal.customer'), value: order.customerName },
              { label: t('delete_modal.phone'), value: order.customerPhone, blue: true },
              { label: t('delete_modal.product'), value: order.product?.name || order.productName },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">{row.label}</span>
                <span className={`font-bold truncate max-w-[160px] ${row.blue ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>
                  {row.value || '—'}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-zinc-700">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">{t('delete_modal.total')}</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {parseFloat(order.totalPrice || 0).toLocaleString()} DA
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={deleting}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50">
              {t('delete_modal.cancel')}
            </button>
            <button onClick={onConfirm} disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-all shadow-lg shadow-rose-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {deleting
                ? <><Loader2 size={16} className="animate-spin" />{t('delete_modal.deleting')}</>
                : <><Trash2 size={16} />{t('delete_modal.confirm')}</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════ */
export default function Orders() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orders' });
  const isRtl = i18n.dir() === 'rtl';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = getAccessToken();

  const statusKeys = Object.values(StatusEnum);

  /* ── Fetch ── */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storeId = getStoreId();
      const { data } = await axios.get(`${baseURL}/orders/${storeId}`, {
        params: { status: statusFilter, query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(data) ? data : (data.data ?? data.orders ?? []));
    } catch (e) {
      console.error(e);
      setError(t('list.error'));
    } finally {
      setLoading(false);
    }
  }, [token, query, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    document.body.style.overflow = (isOpen || !!deleteTarget) ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, deleteTarget]);

  /* ── Filter ── */
  const filtered = orders.filter(o => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || (o.customerName || '').toLowerCase().includes(q) || (o.customerPhone || '').includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ── Export ── */
  const exportToExcel = useCallback(() => {
    if (!filtered.length) { alert(t('list.no_export')); return; }
    const exportData = filtered.map(order => ({
      [t('export.customer_name')]: order.customerName || '',
      [t('export.phone')]: order.customerPhone || '',
      [t('export.product')]: order.product?.name || order.productName || '',
      [t('export.wilaya')]: order.customerWilaya?.ar_name || '',
      [t('export.commune')]: order.customerCommune?.ar_name || '',
      [t('export.ship_type')]: order.typeShip === 'office' ? t('export.ship_office') : t('export.ship_home'),
      [t('export.ship_price')]: parseFloat(order.priceShip || 0),
      [t('export.total')]: parseFloat(order.totalPrice || 0),
      [t('export.status')]: t(`status.${order.status}`) || order.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = Array(9).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('export.sheet_name'));
    XLSX.writeFile(wb, t('export.filename', { date: new Date().toISOString().split('T')[0] }));
  }, [filtered, t]);

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${baseURL}/orders/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      alert(t('delete_modal.failed'));
    } finally {
      setDeleting(false);
    }
  };

  const openModal = (id) => { setOrderId(id); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setOrderId(null); };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* ── Loading / Error ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-gray-400">{t('list.loading')}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <AlertTriangle size={40} className="text-rose-400" />
      <p className="text-sm font-bold text-rose-500">{error}</p>
      <button onClick={fetchOrders}
        className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
        {t('list.retry')}
      </button>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-gray-50/50 dark:bg-zinc-950 font-sans ${isOpen || deleteTarget ? 'overflow-hidden h-screen' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col gap-5">

            {/* Title + search */}
            <div className="flex items-center gap-4 flex-1">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                <ShoppingBag size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('list.title')}</h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{t('list.subtitle')}</p>
              </div>
            </div>

            <div className='flex flex-col xl:flex-row xl:items-center justify-between gap-5'>
              {/* Search bar */}
              <div className="relative w-full xl:max-w-sm">
                <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} size={17} />
                <input
                  type="text"
                  value={searchTerm}
                  placeholder={t('list.search_placeholder')}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setQuery(searchTerm)}
                  className={`w-full py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-400 dark:text-white transition-all ${isRtl ? 'pr-11 pl-24' : 'pl-11 pr-24'}`}
                />
                <button
                  onClick={() => setQuery(searchTerm)}
                  className={`absolute top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all ${isRtl ? 'left-1.5' : 'right-1.5'}`}>
                  {t('list.search_btn')}
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-9 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 cursor-pointer min-w-[180px]"
                  >
                    <option value="">{t('list.all_statuses', { count: orders.length })}</option>
                    {statusKeys.map(val => (
                      <option key={val} value={val}>{t(`status.${val}`)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${isRtl ? 'left-3' : 'right-3'}`} />
                </div>

                <div className="w-px h-7 bg-gray-200 dark:bg-zinc-700 hidden md:block" />

                <button
                  onClick={exportToExcel}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all disabled:opacity-40">
                  <Download size={15} />
                  {t('list.export_excel')}
                </button>

                <button
                  onClick={() => { setQuery(''); setSearchTerm(''); fetchOrders(); }}
                  className="p-2.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all"
                  title={t('list.refresh')}>
                  <RefreshCw size={17} />
                </button>
              </div>
            </div>

            {/* Active search tag */}
            {query && (
              <button
                onClick={() => { setQuery(''); setSearchTerm(''); fetchOrders(); }}
                className="max-w-[170px] flex justify-between items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-full text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">
                <span className="max-w-[140px] truncate">{t('list.search_tag', { query })}</span>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mt-4">
            {t('list.results_count', { filtered: filtered.length, total: orders.length })}
            {statusFilter && (
              <span className="text-indigo-500 font-bold"> {t('list.active_filter', { status: t(`status.${statusFilter}`) })}</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Orders List ── */}
      <div className="max-w-[1400px] mx-auto py-6 space-y-2.5 ">
        {paginated.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-14 text-center">
            <Package size={40} className="mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500">{t('list.no_orders')}</p>
          </div>
        ) : paginated.map((order, i) => {
          const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
          return (
            <div
              key={order.id}
              onDoubleClick={() => openModal(order.id)}
              className={` ${isRtl ? 'pl-7' : 'pr-7'} group relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all cursor-default`}
            >
              {/* Row number + Customer */}
              <div className="flex flex-col w-full md:w-1/4 gap-0.5">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  {truncate(`${order.customerName || '—'} (${(currentPage - 1) * PAGE_SIZE + i + 1})`)}
                </span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setQuery(order.customerPhone); }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">
                  {order.customerPhone}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">{order.paltform || order.platform || '—'}</span>
              </div>

              {/* Product */}
              <div className="flex flex-col w-full md:w-1/4 gap-1">
                <span className="font-semibold text-gray-700 dark:text-zinc-300 text-sm">
                  {truncate(order.product?.name || order.productName || '—')}
                </span>
                {order.variantDetail?.name && Array.isArray(order.variantDetail.name) && (
                  <div className="flex flex-wrap gap-1.5">
                    {order.variantDetail.name.map((attr, index) => (
                      <div key={index} className="flex items-center px-1.5 py-0.5 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700">
                        {attr.displayMode === 'color' ? (
                          <div className="w-4 h-4 rounded-full border border-gray-200 dark:border-zinc-600" style={{ backgroundColor: attr.value }} title={attr.value} />
                        ) : attr.displayMode === 'image' ? (
                          <img className="w-4 h-4 object-cover rounded" src={attr.value} alt="" />
                        ) : (
                          <span className="text-[10px] text-gray-600 dark:text-zinc-400 font-medium">{attr.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {order.offer && (
                  <span className="text-[10px] text-orange-500 dark:text-orange-400 font-bold">{order.offer.name}</span>
                )}
              </div>

              {/* Location */}
              <div className="flex flex-col w-full md:w-1/5 gap-0.5">
                <span className="font-semibold text-sm text-gray-800 dark:text-zinc-200">{order.customerWilaya?.ar_name || '—'}</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{order.customerCommune?.ar_name || '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {order.typeShip === 'office' ? t('list.ship_office') : t('list.ship_home')}
                </span>
              </div>

              {/* Price + Status */}
              <div className={`flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 border-gray-100 dark:border-zinc-800 pt-3 md:pt-0`}>
                <div className={`flex flex-col ${isRtl ? 'items-start' : 'items-end'}`}>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {parseFloat(order.totalPrice || 0).toLocaleString()} DA
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    {t('list.ship_fee', { price: parseFloat(order.priceShip || 0).toLocaleString() })}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyle}`}>
                  {t(`status.${order.status}`) || order.status}
                </span>
              </div>

              {/* Hover actions */}
              <div className={`flex md:flex-col gap-2`}>
                <button
                  onClick={(e) => { e.stopPropagation(); openModal(order.id); }}
                  title={t('list.edit_order')}
                  className="px-5 md:px-1.5 py-0.5 cursor-pointer flex justify-center items-center gap-2 font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                  <Edit2 size={14} />
                  <span >{t('list.edit')}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(order); }}
                  title={t('list.delete_order')}
                  className="px-5 md:px-1.5 py-0.5 cursor-pointer flex justify-center items-center gap-2 font-bold rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-400 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <Trash2 size={14} />
                  <span >{t('list.delete')}</span>
                </button>
                
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="max-w-[1400px] mx-auto px-6 pb-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all`}>
            {isRtl ? <ArrowLeft size={16} className="rotate-180" /> : <ArrowLeft size={16} />}
            {t('list.prev_page')}
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '…'
                ? <span key={`dot-${i}`} className="px-2 text-gray-400 text-sm font-bold select-none">…</span>
                : <button key={p} onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-black transition-all border ${currentPage === p
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                  {p}
                </button>
              )}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {t('list.next_page')}
            {isRtl ? <ArrowRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
          </button>
        </div>
      )}

      {/* ── Edit Modal ── */}
      <OrderModal isOpen={isOpen} onClose={closeModal} orderId={orderId} onRefresh={fetchOrders} />

      {/* ── Delete Modal ── */}
      <DeleteConfirmModal
        order={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  );
}