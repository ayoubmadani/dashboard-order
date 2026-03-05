import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { baseURL } from "../../../constents/const.";
import { getAccessToken } from "../../../services/access-token";
import OrderModal from './orderModel';

export const StatusEnum = {
  PENDING: "pending", APPL1: "appl1", APPL2: "appl2", APPL3: "appl3",
  CONFIRMED: "confirmed", SHIPPING: "shipping", CANCELLED: "cancelled",
  RETURNED: "returned", DELIVERED: "delivered", POSTPONED: "postponed",
};

const STATUS_LABELS = {
  pending: "قيد الانتظار", appl1: "محاولة 1", appl2: "محاولة 2", appl3: "محاولة 3",
  confirmed: "مؤكد", shipping: "في الشحن", cancelled: "ملغى",
  returned: "مرتجع", delivered: "تم التوصيل", postponed: "مؤجل",
};

const STATUS_STYLES = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  appl1: "text-orange-600 bg-orange-50 border-orange-200",
  appl2: "text-orange-600 bg-orange-50 border-orange-200",
  appl3: "text-orange-600 bg-orange-50 border-orange-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  shipping: "text-cyan-600 bg-cyan-50 border-cyan-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  returned: "text-purple-600 bg-purple-50 border-purple-200",
  delivered: "text-green-600 bg-green-50 border-green-200",
  postponed: "text-gray-500 bg-gray-50 border-gray-200",
};

const truncate = (text = "", maxLength = 18) =>
  text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

const getStoreId = () => localStorage.getItem("storeId");

/* ══════════════════════════════════════════════════════════════
   Delete Confirm Modal
══════════════════════════════════════════════════════════════ */
function DeleteConfirmModal({ order, onConfirm, onCancel, deleting }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Card */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "zoomIn .18s ease" }}
        dir="rtl"
      >
        {/* Red accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-400" />

        <div className="p-6 space-y-5">

          {/* Icon + title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">حذف الطلب</h3>
              <p className="text-xs text-gray-400 mt-0.5">هذا الإجراء لا يمكن التراجع عنه</p>
            </div>
          </div>

          {/* Order summary card */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 border border-gray-100 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">العميل</span>
              <span className="font-bold text-gray-800">{order.customerName || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">الهاتف</span>
              <span className="font-bold text-blue-600">{order.customerPhone || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">المنتج</span>
              <span className="font-bold text-gray-700 truncate max-w-[160px]">
                {order.product?.name || order.productName || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-400 font-medium">الإجمالي</span>
              <span className="text-base font-black text-green-600">
                {parseFloat(order.totalPrice || 0).toLocaleString()} DA
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                </svg>
              )}
              {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes zoomIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════ */
export default function Orders() {
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

  // ── Delete state ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null); // full order object
  const [deleting, setDeleting] = useState(false);

  const token = getAccessToken();

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storeId = getStoreId();
      console.log(storeId);
      
      // دمج الإعدادات في كائن واحد
      const { data } = await axios.get(`${baseURL}/orders/${storeId}`, {
        params: {
          status: statusFilter,
          query: query
        },
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      console.log(data);
      setOrders(Array.isArray(data) ? data : (data.data ?? data.orders ?? []));
    } catch (e) {
      console.error(e);
      setError("تعذّر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }, [token, query, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Lock scroll when any modal is open
  useEffect(() => {
    document.body.style.overflow = (isOpen || !!deleteTarget) ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, deleteTarget]);

  // ── Filter ────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || (
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q)
    );
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Export ────────────────────────────────────────────────────
  const exportToExcel = useCallback(() => {
    if (filtered.length === 0) { alert("لا توجد طلبات للتصدير"); return; }
    const exportData = filtered.map(order => ({
      'اسم الزبون': order.customerName || '',
      'رقم الهاتف': order.customerPhone || '',
      'المنتج': order.product?.name || order.productName || '',
      'الولاية': order.customerWilaya?.ar_name || '',
      'البلدية': order.customerCommune?.ar_name || '',
      'نوع التوصيل': order.typeShip === "office" ? "مكتب" : "منزل",
      'سعر الشحن': parseFloat(order.priceShip || 0),
      'الإجمالي': parseFloat(order.totalPrice || 0),
      'الحالة': STATUS_LABELS[order.status] || order.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلبات");
    XLSX.writeFile(wb, `طلبات_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filtered]);

  // ── Delete ────────────────────────────────────────────────────
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
      alert("فشل حذف الطلب، حاول مرة أخرى");
    } finally {
      setDeleting(false);
    }
  };

  const openModal = (id) => { setOrderId(id); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setOrderId(null); };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Loading / Error states ────────────────────────────────────
  if (loading) return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400">جار تحميل الطلبات…</p>
      </div>
    </div>
  );

  if (error) return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm font-bold text-rose-500">{error}</p>
      <button onClick={fetchOrders} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold">
        إعادة المحاولة
      </button>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className={`flex flex-col gap-6 p-4 md:p-8 bg-gray-50 min-h-screen font-sans ${isOpen || deleteTarget ? "overflow-hidden h-screen" : "overflow-auto"}`}
    >
      {/* ── Search & Filter Panel ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 transition-all">
        <div className="flex flex-col xl:flex-row gap-5 items-center justify-between">

          <div className="relative w-full xl:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              placeholder="بحث بالاسم، الهاتف..."
              className="w-full pl-11 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setQuery(searchTerm)}
            />
            <button
              onClick={() => setQuery(searchTerm)}
              className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              بحث
            </button>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full md:w-52">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">📊 كل الحالات ({orders.length})</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-gray-200 hidden md:block mx-1" />

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={exportToExcel}
                disabled={filtered.length === 0}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير Excel
              </button>

              <button
                onClick={() => { setQuery(''); setSearchTerm(''); fetchOrders(); }}
                className="p-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-900 hover:text-white transition-all active:rotate-180 duration-500"
                title="تحديث البيانات"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {query && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button
                    onClick={() => { setQuery(''); setSearchTerm(''); fetchOrders(); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-bold hover:bg-red-600 hover:text-white transition-all group shadow-sm"
                  >
                    <span className="max-w-[150px] truncate">بحث: {query}</span>
                    <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden md:block" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Counter ── */}
      <p className="text-xs text-gray-400 font-medium">
        عرض <span className="font-black text-gray-700">{filtered.length}</span> من{" "}
        <span className="font-black text-gray-700">{orders.length}</span> طلب
        {statusFilter && <span className="text-blue-500 font-bold"> · {STATUS_LABELS[statusFilter]}</span>}
      </p>

      {/* ── Orders list ── */}
      <div className="grid gap-3">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm font-bold text-gray-400">لا توجد طلبات مطابقة</p>
          </div>
        ) : paginated.map((order, i) => (
          /* ── Order row: div instead of button so we can nest real buttons ── */
          <div
            key={order.id}
            onDoubleClick={() => openModal(order.id)}
            className="relative bg-white rounded-xl border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-blue-200 hover:shadow-sm transition-all text-right cursor-default group"
          >

            {/* ── Hover action buttons (top-left) ── */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
              {/* Edit */}
              <button
                onClick={(e) => { e.stopPropagation(); openModal(order.id); }}
                title="تعديل الطلب"
                className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(order); }}
                title="حذف الطلب"
                className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* العميل */}
            <div className="flex flex-col w-full md:w-1/4 gap-0.5">
              <span className="font-bold text-gray-900">{truncate(`${order.customerName} (${i + 1})`)}</span>
              <span className="text-sm text-blue-600 font-medium">
                <span
                  onClick={(e) => { e.stopPropagation(); setQuery(order.customerPhone); }}
                  role="button"
                  className="cursor-pointer hover:underline"
                >
                  {order.customerPhone}
                </span>
              </span>
              <span className="text-[10px] text-gray-400">{order.paltform || order.platform || "—"}</span>
            </div>

            {/* المنتج */}
            <div className="flex flex-col w-full md:w-1/4 gap-0.5">
              <span className="font-bold text-gray-700 text-sm">
                {truncate(order.product?.name || order.productName || "—")}
              </span>
              {order.variantDetail?.name && Array.isArray(order.variantDetail.name) && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {order.variantDetail.name.map((attr, index) => (
                    <div key={index} className="flex items-center gap-1 px-2 py-0.5 rounded shadow-sm">
                      {attr.displayMode === "color" ? (
                        <div
                          className="w-5 h-5 rounded-full border border-gray-300"
                          style={{ backgroundColor: attr.value }}
                          title={attr.value}
                        />
                      ) : attr.displayMode === "image" ? (
                        <img className="w-5 h-5 object-cover rounded" src={attr.value} alt="" />
                      ) : (
                        <span className="text-[10px] text-gray-700 font-medium">{attr.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {order.offer && (
                <span className="text-[10px] text-orange-500 font-bold">{order.offer.name}</span>
              )}
            </div>

            {/* الموقع */}
            <div className="flex flex-col w-full md:w-1/5 gap-0.5">
              <span className="font-bold text-sm text-gray-800">{order.customerWilaya?.ar_name || "—"}</span>
              <span className="text-xs text-gray-500">{order.customerCommune?.ar_name || "—"}</span>
              <span className="text-[10px] text-gray-400">
                {order.typeShip === "office" ? "🏢 مكتب" : "🏠 منزل"}
              </span>
            </div>

            {/* السعر + الحالة */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 md:border-r border-gray-100 pt-3 md:pt-0 md:pr-6">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-lg font-black text-green-600 leading-none">
                  {parseFloat(order.totalPrice || 0).toLocaleString()} DA
                </span>
                <span className="text-[10px] text-gray-400">
                  +{parseFloat(order.priceShip || 0).toLocaleString()} توصيل
                </span>
              </div>
              <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            السابق
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dot-${i}`} className="px-2 text-gray-400 text-sm font-bold select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-black transition-all border ${currentPage === p
                      ? "bg-gray-900 text-white border-gray-900 shadow-md"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {p}
                  </button>
                )
              )
            }
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            التالي
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Edit Modal ── */}
      <OrderModal
        isOpen={isOpen}
        onClose={closeModal}
        orderId={orderId}
        onRefresh={fetchOrders}
      />

      {/* ── Delete Confirm Modal ── */}
      <DeleteConfirmModal
        order={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        deleting={deleting}
      />
    </div>
  );
}