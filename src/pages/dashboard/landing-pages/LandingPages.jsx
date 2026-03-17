import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Rocket, Plus, ExternalLink, Copy,
  Edit2, Trash2, Power, Check,
  Loader2, AlertCircle, Package,
  RefreshCw, Search, X, Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import { CopyPlus } from 'lucide-react';
import { Loader2Icon } from 'lucide-react';

const getProductImage = (page) =>
  page.urlImage ||
  page.product?.productImage ||
  page.product?.imagesProduct?.[0]?.imageUrl ||
  null;

// Truncate text to max length
const truncate = (text, maxLength = 20) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

const LandingPages = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'landing' });
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [updatingPlatformId, setUpdatingPlatformId] = useState(null);


  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');

  /* ── Fetch ── */
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${baseURL}/landing-page/store/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPages(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch (err) {
      console.error('Failed to fetch landing pages:', err);
      setError(err?.response?.data?.message || t('fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [token, storeId, t]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  /* ── Handlers ── */
  const handleCopyLink = useCallback((page) => {
    const url = `${window.location.origin}/lp/${page.domain}`;
    navigator.clipboard.writeText(url);
    setCopiedId(page.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm(t('confirm_delete'))) return;
    setDeletingId(id);
    try {
      await axios.delete(`${baseURL}/landing-page/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPages();

    } catch (err) {
      alert(t('delete_error'));
    } finally {
      setDeletingId(null);
    }
  }, [token, t]);

  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const res = await axios.get(
        `${baseURL}/landing-page/toggle-status/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Toggle response:', res.data);

      // ✅ Extract status from response (handle different response structures)
      const newStatus = res.data;

      // ✅ Update the page with new status
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus, isActive: newStatus } : p))
      );
    } catch (err) {
      console.error('Toggle error:', err);
      alert(t('toggle_error'));
    } finally {
      setTogglingId(null);
    }
  }, [token, t]);


  const handleDuplicate = useCallback(async (id) => {
    if (!window.confirm(t('common.confirm_duplicate'))) return;

    setDuplicatingId(id);
    try {
      const res = await axios.post(
        `${baseURL}/landing-page/duplicate/${id}`,
        {}, // غالباً يكون طلب POST فارغ الجسم
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // إضافة الصفحة الجديدة المحملة من السيرفر إلى القائمة
      fetchPages();
    } catch (err) {
      console.error(err);
      alert(t('common.duplicate_error'));
    } finally {
      setDuplicatingId(null);
    }
  }, [token, t, baseURL]);

  const handleUpdatePlatform = useCallback(async (id, platformValue) => {
    setUpdatingPlatformId(id); // هنا يتم استخدام المتغير الذي تسبب في الخطأ
    try {
      await axios.patch(
        `${baseURL}/landing-page/update-platform/${id}`,
        { platform: platformValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // يمكنك إضافة تنبيه نجاح هنا
    } catch (err) {
      console.error(err);
      alert(t('common.update_error'));
    } finally {
      setUpdatingPlatformId(null); // إعادة الحالة للطبيعية بعد انتهاء الطلب
    }
  }, [token, baseURL, t]);

  const filteredPages = pages.filter(page =>
    page.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.platform?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-rose-200 dark:border-rose-900 border-t-rose-500 rounded-full animate-spin" />
            <Rocket className="absolute inset-0 m-auto text-rose-500" size={24} />
          </div>
          <p className="text-gray-500 dark:text-zinc-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-zinc-800 max-w-md w-full">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-rose-500" size={32} />
          </div>
          <p className="text-gray-900 dark:text-white font-bold mb-4">{error}</p>
          <button
            onClick={fetchPages}
            className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors w-full"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg shadow-rose-500/25">
                  <Rocket size={22} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {t('dashboard.landing')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {pages.length} {t('pages_count')}
                </p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full sm:w-64 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                onClick={fetchPages}
                className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shrink-0"
                title={t('common.refresh')}
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>

              <Link
                to="/dashboard/landing-pages/create"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shrink-0 shadow-lg"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{t('create_new')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-sm">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-600 dark:text-zinc-400">{pages.filter(p => p.status === 'active').length} {t('status.active')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600 dark:text-zinc-400">{pages.filter(p => p.status !== 'active').length} {t('status.inactive')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm">
            <Eye size={14} className="text-rose-500" />
            <span className="text-gray-600 dark:text-zinc-400">{pages.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()} {t('common.views')}</span>
          </div>
        </div>

        {/* Empty State */}
        {filteredPages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPages.map((page) => {
              const imgSrc = getProductImage(page);
              const fullUrl = `${storeURL}/lp/${page.domain}`;
              const isActive = page.isActive;
              const isToggling = togglingId === page.id;

              return (
                <div
                  key={page.id}
                  className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${isActive
                    ? 'border-gray-200 dark:border-zinc-800 shadow-md hover:shadow-xl hover:shadow-rose-500/5'
                    : 'border-gray-200 dark:border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                >
                  {/* Status Indicator Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`} />

                  <div className="p-4 sm:p-5">
                    {/* Header: Image + Title */}
                    <div className="flex items-start gap-3 sm:gap-4 mb-4">
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 ring-2 ring-offset-2 ${isActive ? 'ring-emerald-500/20' : 'ring-gray-200 dark:ring-zinc-700'}`}>
                          {imgSrc ? (
                            <img src={imgSrc} alt={truncate(page.product?.name, 20)} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={20} className="sm:w-6 sm:h-6" />
                            </div>
                          )}
                        </div>
                        {/* Online Status Dot */}
                        <div className={`absolute -bottom-1 ${isRtl ? '-left-1' : '-right-1'} w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-zinc-900 ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                          {isActive && <div className="w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight mb-1 truncate" title={page.product?.name}>
                          {truncate(page.product?.name, 20)}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                            {page.platform || 'MD'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ● {t('status.active')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* URL & Price Row */}
                    <div className="flex items-center justify-between mb-4 p-2.5 sm:p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ExternalLink size={12} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-zinc-400 truncate font-mono">
                          {truncate(page.domain, 22)}
                        </span>
                      </div>
                      <span className="text-sm font-black text-gray-900 dark:text-white ml-2 shrink-0">
                        {page.product?.price
                          ? `${parseFloat(String(page.product.price)).toLocaleString(isRtl ? 'ar-DZ' : 'en-US')}`
                          : '—'}
                      </span>
                    </div>

                    {/* Platform Edit Row */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative flex-1 group">
                        <input
                          type="text"
                          value={page.platform || ''}
                          placeholder={t('platform_placeholder')}
                          onChange={(e) => setPages((prev) =>
                            prev.map((p) => (p.id === page.id ? { ...p, platform: e.target.value } : p))
                          )}
                          className="w-full pl-3 pr-10 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                        />
                        <Edit2 size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      <button
                        onClick={() => handleUpdatePlatform(page.id, page.platform)}
                        disabled={updatingPlatformId === page.id}
                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all disabled:opacity-50"
                      >
                        {updatingPlatformId === page.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                    </div>

                    {/* Action Buttons Row */}
                    <div className={`flex items-center justify-between gap-1.5 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggleStatus(page.id, isActive)}
                          disabled={isToggling}
                          className={`p-2 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-400'} disabled:opacity-50`}
                          title={isActive ? t('common.deactivate') : t('common.activate')}
                        >
                          {isToggling ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                        </button>

                        {/* Copy */}
                        <button
                          onClick={() => handleCopyLink(page)}
                          className={`p-2 rounded-xl transition-all ${copiedId === page.id ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600'}`}
                        >
                          {copiedId === page.id ? <Check size={16} /> : <Copy size={16} />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => navigate(`/dashboard/landing-pages/edit/${page.id}`)}
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(page.id)}
                          disabled={duplicatingId === page.id}
                          className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          {duplicatingId === page.id ? <Loader2 size={16} className="animate-spin" /> : <CopyPlus size={16} />}
                        </button>
                      </div>

                      {/* Delete (Isolated to prevent accidental clicks) */}
                      <button
                        onClick={() => handleDelete(page.id)}
                        disabled={deletingId === page.id}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                      >
                        {deletingId === page.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>

                    {/* View Link - Full Width */}
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => !isActive && e.preventDefault()}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${isActive
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed border-transparent'
                        }`}
                    >
                      <Eye size={14} />
                      <span className="truncate max-w-[180px] dir-ltr">{fullUrl.replace(/^https?:\/\//, '')}</span>
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Add New Card */}
            <Link
              to="/dashboard/landing-pages/create"
              className="group relative border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-rose-500 hover:text-rose-500 transition-all min-h-[280px] hover:bg-rose-50/30 dark:hover:bg-rose-500/5"
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                <Plus size={28} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white mb-1">{t('add_new')}</p>
                <p className="text-xs text-gray-500">{t('create_desc')}</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPages;