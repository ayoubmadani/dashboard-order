import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { baseURL } from "../../../constents/const.";
import { getAccessToken } from "../../../services/access-token";
import OrderModal from './orderModel';

export const StatusEnum = {
  PENDING: "pending",
  APPL1: "appl1",
  APPL2: "appl2",
  APPL3: "appl3",
  CONFIRMED: "confirmed",
  SHIPPING: "shipping",
  CANCELLED: "cancelled",
  RETURNED: "returned",
  DELIVERED: "delivered",
  POSTPONED: "postponed",
};

const STATUS_LABELS = {
  pending: "قيد الانتظار",
  appl1: "محاولة 1",
  appl2: "محاولة 2",
  appl3: "محاولة 3",
  confirmed: "مؤكد",
  shipping: "في الشحن",
  cancelled: "ملغى",
  returned: "مرتجع",
  delivered: "تم التوصيل",
  postponed: "مؤجل",
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

  const token = getAccessToken();

  // ── Fetch orders ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const storeId = getStoreId();
      const { data } = await axios.get(`${baseURL}/orders/${storeId}?query=${query}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  // ── Lock body scroll when modal is open ───────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // ── Filter (لازم يكون قبل exportToExcel) ─────────────────────
  const filtered = orders.filter(o => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || (
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerPhone || '').includes(q)
    );
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Export to Excel ───────────────────────────────────────────
  const exportToExcel = useCallback(() => {
    if (filtered.length === 0) {
      alert("لا توجد طلبات للتصدير");
      return;
    }

    // تحضير البيانات للتصدير
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

    // إنشاء ورقة العمل
    const ws = XLSX.utils.json_to_sheet(exportData);

    // تعديل عرض الأعمدة
    const colWidths = [
      { wch: 20 },  // اسم الزبون
      { wch: 15 },  // رقم الهاتف
      { wch: 25 },  // المنتج
      { wch: 15 },  // الولاية
      { wch: 15 },  // البلدية
      { wch: 12 },  // نوع التوصيل
      { wch: 12 },  // سعر الشحن
      { wch: 12 },  // الإجمالي
      { wch: 12 },  // الحالة
      { wch: 20 },  // التاريخ
    ];
    ws['!cols'] = colWidths;

    // إنشاء ملف Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلبات");

    // تحميل الملف
    const fileName = `طلبات_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filtered]); // ✅ التبعية الصحيحة

  const openModal = (id) => { setOrderId(id); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); setOrderId(null); };

  // Reset to page 1 when search or filter changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Render: loading ───────────────────────────────────────────
  if (loading) return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400">جار تحميل الطلبات…</p>
      </div>
    </div>
  );

  // ── Render: error ─────────────────────────────────────────────
  if (error) return (
    <div dir="rtl" className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm font-bold text-rose-500">{error}</p>
      <button
        onClick={fetchOrders}
        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold"
      >
        إعادة المحاولة
      </button>
    </div>
  );

  // ── Render: main ──────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className={`flex flex-col gap-6 p-4 md:p-8 bg-gray-50 min-h-screen font-sans ${isOpen ? "overflow-hidden h-screen" : "overflow-auto"}`}
    >
      {/* ── Search & Filter Panel ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 transition-all">
        <div className="flex flex-col xl:flex-row gap-5 items-center justify-between">

          {/* Left Side: Search Bar */}
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

          {/* Right Side: Filters & Actions */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full xl:w-auto">

            {/* Status Select */}
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

            <div className="h-8 w-[1px] bg-gray-200 hidden md:block mx-1"></div>

            {/* Action Buttons */}
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

              {/* ── Active Search Filter Tag ── */}
              {(query && query !== '') && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <button
                    onClick={() => {
                      setQuery('');
                      setSearchTerm('');
                      fetchOrders();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-bold hover:bg-red-600 hover:text-white transition-all group shadow-sm"
                    title="إلغاء البحث"
                  >
                    <span className="max-w-[150px] truncate">بحث: {query}</span>

                    {/* أيقونة الإغلاق */}
                    <svg
                      className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* خط فاصل صغير جمالي */}
                  <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>
                </div>
              )}


            </div>
          </div>
        </div>
      </div>

      {/* ── Counter ── */}
      <p className="text-xs text-gray-400 font-medium">
        عرض <span className="font-black text-gray-700">{filtered.length}</span> من <span className="font-black text-gray-700">{orders.length}</span> طلب
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
          <button
            key={order.id}
            onDoubleClick={() => openModal(order.id)}
            className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-blue-200 hover:shadow-sm transition-all text-right w-full"
          >
            {/* العميل */}
            <div className="flex flex-col w-full md:w-1/4 gap-0.5">
              <span className="font-bold text-gray-900">{truncate(`${order.customerName} (${i + 1})`)}</span>
              <span className="text-sm text-blue-600 font-medium"><button onClick={() => setQuery(order.customerPhone)} className='cursor-pointer'>{order.customerPhone}</button></span>
              <span className="text-[10px] text-gray-400">{order.paltform || order.platform || "—"}</span>
            </div>

            {/* المنتج */}
            <div className="flex flex-col w-full md:w-1/4 gap-0.5">
              <span className="font-bold text-gray-700 text-sm">
                {truncate(order.product?.name || order.productName || "—")}
              </span>
              {order.variantDetail?.name && (
                <span className="text-[10px] text-gray-400">
                  {typeof order.variantDetail.name === "object"
                    ? Object.values(order.variantDetail.name).join(" | ")
                    : order.variantDetail.name
                  }
                </span>
              )}
              {order.offer && (
                <span className="text-[10px] text-orange-500 font-bold">{`${order.offer.name}`}</span>
              )}
            </div>

            {/* الموقع */}
            <div className="flex flex-col w-full md:w-1/5 gap-0.5">
              <span className="font-bold text-sm text-gray-800">
                {order.customerWilaya?.ar_name || "—"}
              </span>
              <span className="text-xs text-gray-500">
                {order.customerCommune?.ar_name || "—"}
              </span>
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
          </button>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">

          {/* Previous */}
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

          {/* Page numbers */}
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

          {/* Next */}
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

      {/* ── Modal ── */}
      <OrderModal
        isOpen={isOpen}
        onClose={closeModal}
        orderId={orderId}
        onRefresh={fetchOrders}
      />
    </div>
  );
}