import React, { useState, useEffect } from 'react';
import {
  Save, ArrowLeft, Search,
  Home, Building2, RefreshCcw,
  Filter, Plus, Sparkles, Loader2,
  CheckCircle2, XCircle, RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';


// ─────────────────────────────────────────────
//  Utility – stable header builder
// ─────────────────────────────────────────────
function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}


// ─────────────────────────────────────────────
//  Sub-component: price input cell
// ─────────────────────────────────────────────
function PriceCell({ value, onChange, focusRing }) {
  return (
    <div className="relative flex items-center" dir="ltr">
      <input
        type="number"
        min="0"
        dir="ltr"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full bg-white dark:bg-zinc-800
          border border-gray-200 dark:border-zinc-700
          rounded-xl py-2 pl-3 pr-10
          text-sm font-bold text-gray-700 dark:text-zinc-200
          ${focusRing}
          outline-none transition-all
        `}
      />
      <span className="absolute right-3 text-xs font-semibold text-gray-400 dark:text-zinc-500 pointer-events-none select-none">
        DA
      </span>
    </div>
  );
}


// ─────────────────────────────────────────────
//  Sub-component: status checkbox
// ─────────────────────────────────────────────
function StatusToggle({ isActive, onToggle, loading }) {
  return (
    <label className={`relative flex items-center justify-center cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <input
        type="checkbox"
        checked={!!isActive}
        onChange={onToggle}
        className="sr-only peer"
      />
      {/* Custom checkbox box */}
      <div
        className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
          ${isActive
            ? 'bg-emerald-500 border-emerald-500'
            : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}
        `}
      >
        {isActive && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {loading && (
          <svg className="w-3 h-3 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
      </div>
    </label>
  );
}


// ─────────────────────────────────────────────
//  Sub-component: empty state
// ─────────────────────────────────────────────
function EmptyState({ onInitialize, isLoading }) {
  return (
    <tr>
      <td colSpan={6}>
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          {/* Illustration */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-indigo-400 dark:text-indigo-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-black">!</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-gray-800 dark:text-white">
              قائمة الولايات فارغة
            </p>
            <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-xs">
              اضغط على الزر أدناه لتهيئة أسعار الشحن لكافة الولايات الـ 58 تلقائياً.
            </p>
          </div>

          <button
            onClick={onInitialize}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isLoading ? 'جارٍ التهيئة…' : 'تهيئة كافة الولايات (58)'}
          </button>
        </div>
      </td>
    </tr>
  );
}


// ─────────────────────────────────────────────
//  Sub-component: wilaya row
// ─────────────────────────────────────────────
function WilayaRow({ wilaya, onPriceChange, onToggle, onSave, toggleLoading, saveLoading }) {
  return (
    <tr className="group border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
      {/* Code + Name */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black shrink-0">
            {wilaya.code ?? wilaya.id}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
            {wilaya.name}
          </span>
        </div>
      </td>

      {/* Home price */}
      <td className="px-4 py-3 w-36">
        <PriceCell
          value={wilaya.livraisonHome}
          onChange={(v) => onPriceChange(wilaya.id, 'livraisonHome', v)}
          focusRing="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </td>

      {/* Office price */}
      <td className="px-4 py-3 w-36">
        <PriceCell
          value={wilaya.livraisonOfice}
          onChange={(v) => onPriceChange(wilaya.id, 'livraisonOfice', v)}
          focusRing="focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />
      </td>

      {/* Return price */}
      <td className="px-4 py-3 w-36">
        <PriceCell
          value={wilaya.livraisonReturn}
          onChange={(v) => onPriceChange(wilaya.id, 'livraisonReturn', v)}
          focusRing="focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
        />
      </td>

      {/* Status toggle */}
      <td className="px-4 py-3 text-center">
        <StatusToggle
          isActive={wilaya.isActive}
          onToggle={() => onToggle(wilaya.id)}
          loading={toggleLoading === wilaya.id}
        />
        
      </td>

      {/* Row save button */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onSave(wilaya)}
          disabled={saveLoading === wilaya.id}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saveLoading === wilaya.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          حفظ
        </button>
      </td>
    </tr>
  );
}


// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────
export default function Shipping() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const headers = useAuthHeaders();

  // ── State ──────────────────────────────────
  const [wilayas, setWilayas]               = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [isInitializing, setIsInitializing] = useState(false);   // FIX #1: boolean not string
  const [isSavingAll, setIsSavingAll]       = useState(false);
  const [toggleLoading, setToggleLoading]   = useState(null);    // id of row being toggled
  const [saveLoading, setSaveLoading]       = useState(null);    // id of row being saved
  const [toast, setToast]                   = useState(null);    // { type: 'success'|'error', msg }

  // ── Toast helper ───────────────────────────
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── API helpers ────────────────────────────
  const getShipping = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
      setWilayas(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات الشحن:', error);
      showToast('error', 'فشل في جلب بيانات الشحن');
    }
  };

  useEffect(() => { getShipping(); }, []);

  // ── Initialize all wilayas ─────────────────
  const handleCreateAll = async () => {
    setIsInitializing(true);
    try {
      const getResponse = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
      let finalData = getResponse.data;  // FIX #2: was .dta

      if (!finalData || finalData.length === 0) {
        await axios.get(`${baseURL}/shipping/create-shipping`, headers);
        const refreshResponse = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
        finalData = refreshResponse.data;
      }

      setWilayas(finalData);
      showToast('success', 'تمت تهيئة الولايات بنجاح');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 409) {
        const fallback = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
        setWilayas(fallback.data);
        showToast('success', 'تم جلب الولايات الموجودة');
      } else {
        console.error('خطأ في تهيئة الشحن:', error);
        showToast('error', 'حدث خطأ أثناء التهيئة');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // ── Save single row ────────────────────────
  const handleSaveRow = async (wilaya) => {
    setSaveLoading(wilaya.id);
    try {
      await axios.post(
        `${baseURL}/shipping/update-shipping`,
        [{ wilayaId: wilaya.id, priceHome: wilaya.livraisonHome, priceOffice: wilaya.livraisonOfice, priceReturn: wilaya.livraisonReturn, isActive: wilaya.isActive }],
        headers
      );
      showToast('success', `تم حفظ ${wilaya.name} بنجاح`);
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      showToast('error', `فشل حفظ ${wilaya.name}`);
    } finally {
      setSaveLoading(null);
    }
  };

  // ── Save all rows  (FIX #4) ────────────────
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      const payload = wilayas.map((w) => ({
        wilayaId:        w.id,
        priceHome:   w.livraisonHome,
        priceOffice:  w.livraisonOfice,
        priceReturn: w.livraisonReturn,
        isActive:        w.isActive,
      }));
      await axios.post(`${baseURL}/shipping/update-shipping`, payload, headers);
      showToast('success', 'تم حفظ كافة التغييرات بنجاح');
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      showToast('error', 'فشل في حفظ التغييرات');
    } finally {
      setIsSavingAll(false);
    }
  };

  // ── Price change ───────────────────────────
  const handlePriceChange = (id, field, value) => {
    setWilayas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // ── Toggle status (FIX #5) ─────────────────
  const toggleStatus = async (id) => {
    const wilaya = wilayas.find((w) => w.id === id); // FIX: use .find + guard
    if (!wilaya) return;

    setToggleLoading(id);
    try {
      await axios.post(
        `${baseURL}/shipping/update-shipping`,
        [{ wilayaId: id, isActive: !wilaya.isActive }],
        headers
      );
      await getShipping();
    } catch (error) {
      console.error('خطأ في تغيير الحالة:', error);
      showToast('error', 'فشل في تغيير حالة الولاية');
    } finally {
      setToggleLoading(null);
    }
  };

  // ── Filtered list (FIX #3) ─────────────────
  const filteredWilayas = wilayas.filter(
    (w) =>
      w.name.includes(searchQuery) ||
      String(w.code ?? w.id).includes(searchQuery) // FIX: stringify code
  );


  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">

      {/* ── Toast notification ── */}
      {toast && (
        <div
          className={`
            fixed top-5 ${isRtl ? 'left-5' : 'right-5'} z-50
            flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
            text-sm font-semibold text-white
            transition-all animate-fade-in
            ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}
          `}
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Left: back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
          </button>

          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">
              {t('shipping.title', 'أسعار شحن الولايات')}
            </h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
              {t('shipping.subtitle', 'تخصيص تكاليف التوصيل للمنزل والمكتب لكل ولاية')}
            </p>
          </div>
        </div>

        {/* Right: save all */}
        {wilayas.length > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSavingAll
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            {t('common.save_all', 'حفظ كافة التغييرات')}
          </button>
        )}
      </div>

      {/* ── Search & Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t('shipping.search_placeholder', 'ابحث باسم الولاية أو الرمز...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full bg-white dark:bg-zinc-900
              border border-gray-100 dark:border-zinc-800
              rounded-xl py-3
              ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}
              outline-none focus:ring-4 focus:ring-indigo-500/10
              dark:text-white text-sm font-medium
              placeholder:text-gray-400 dark:placeholder:text-zinc-600
              transition-all shadow-sm
            `}
          />
        </div>

        {/* Filter button (visual only – extend as needed) */}
        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all">
          <Filter className="w-4 h-4" />
          {t('shipping.filter_region', 'تصفية حسب المنطقة')}
        </button>

        {/* Refresh button */}
        <button
          onClick={getShipping}
          className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
          title="تحديث"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Table head */}
            <thead className="bg-gray-50/80 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3 text-start text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('shipping.state', 'الولاية')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-indigo-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" />
                    {t('shipping.home', 'للمنزل')}
                  </div>
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {t('shipping.office', 'للمكتب')}
                  </div>
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-rose-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    {t('shipping.return', 'الإرجاع')}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('status', 'الحالة')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('action', 'إجراء')}
                </th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {wilayas.length === 0 ? (
                <EmptyState
                  onInitialize={handleCreateAll}
                  isLoading={isInitializing}
                />
              ) : filteredWilayas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 dark:text-zinc-600 text-sm font-medium">
                    لا توجد ولايات تطابق بحثك
                  </td>
                </tr>
              ) : (
                filteredWilayas.map((wilaya) => (
                  <WilayaRow
                    key={wilaya.id}
                    wilaya={wilaya}
                    onPriceChange={handlePriceChange}
                    onToggle={toggleStatus}
                    onSave={handleSaveRow}
                    toggleLoading={toggleLoading}
                    saveLoading={saveLoading}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        {wilayas.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              {t('shipping.note', 'ملاحظة: هذه الأسعار تظهر للزبائن عند اختيار الولاية في المتجر.')}
            </p>
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
            >
              {isSavingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t('shipping.bulk_edit', 'حفظ جماعي')}
            </button>
          </div>
        )}
      </div>

      {/* Count badge */}
      {wilayas.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-3 text-center">
          {filteredWilayas.length} من {wilayas.length} ولاية
        </p>
      )}

    </div>
  );
}