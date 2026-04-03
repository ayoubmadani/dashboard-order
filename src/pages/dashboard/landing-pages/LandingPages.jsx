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
import { ShoppingBag } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Layout } from 'lucide-react';
import Loading from '../../../components/Loading';
import { Share2 } from 'lucide-react';

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
      console.log(res.data);

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
  // ✅ إصلاح: تنسيق الرابط بشكل صحيح
  const handleCopyLink = useCallback((page) => {
    // page.domain يحتوي على: shamsou-game.mdstore.top/lp/page-name
    // storeURL يحتوي على: https://store.mdstore.top
    const url = `https://${page.domain}`; // ✅ تصحيح: إضافة /lp/ مرة واحدة

    navigator.clipboard.writeText(url);
    setCopiedId(page.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, [storeURL]); // ✅ إضافة storeURL للـ dependencies

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
  }, [token, t, fetchPages]); // ✅ إضافة fetchPages للـ dependencies

  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const res = await axios.get(
        `${baseURL}/landing-page/toggle-status/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Toggle response:', res.data);

      // ✅ إصلاح: التعامل مع مختلف أنواع الاستجابات
      let newStatus;
      if (typeof res.data === 'boolean') {
        newStatus = res.data;
      } else if (res.data?.isActive !== undefined) {
        newStatus = res.data.isActive;
      } else if (res.data?.status !== undefined) {
        newStatus = res.data.status === 'active';
      } else {
        newStatus = !currentStatus; // fallback
      }

      // ✅ Update the page with new status
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus, isActive: newStatus } : p))
      );
    } catch (err) {
      console.error('Toggle error:', err);
      alert(err?.response?.data?.message || t('toggle_error'));
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
        {},
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
  }, [token, t, fetchPages]); // ✅ إضافة fetchPages للـ dependencies

  const handleUpdatePlatform = useCallback(async (id, platformValue) => {
    setUpdatingPlatformId(id);
    try {
      await axios.patch(
        `${baseURL}/landing-page/update-platform/${id}`,
        { platform: platformValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // يمكنك إضافة تنبيه نجاح هنا
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || t('common.update_error'));
    } finally {
      setUpdatingPlatformId(null);
    }
  }, [token, t]); // ✅ إزالة baseURL لأنه مستورد وليس state

  const filteredPages = pages.filter(page =>
    page.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.platform?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Loading />
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
    <div className="min-h-[calc(100vh-200px)] bg-gray-50 dark:bg-zinc-950 pb-20" dir={isRtl ? 'rtl' : 'ltr'}>

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
            <span className="text-gray-600 dark:text-zinc-400">{pages.filter(p => p.isActive).length} {t('status.active')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600 dark:text-zinc-400">{pages.filter(p => !p.isActive).length} {t('status.inactive')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm">
            <Eye size={14} className="text-rose-500" />
            <span className="text-gray-600 dark:text-zinc-400">{pages.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()} {t('common.views')}</span>
          </div>
        </div>

        {filteredPages.length === 0 && (
          <div className='w-full h-[200px] flex justify-center items-center'>
            <div className='flex flex-col justify-center items-center'>
              <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Layout size={20} className="text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{searchQuery ? t('empty.no_results') : t('empty.title')}</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {searchQuery ? t('empty.no_results_sub') : t('empty.subtitle')}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPages.map((page) => {
              const imgSrc = getProductImage(page);
              // ✅ إصلاح: تنسيق الرابط الصحيح
              const fullUrl = page.domain;
              const isActive = page.isActive;
              const isToggling = togglingId === page.id;
              const mockViewsCount = page.showsCount || (page.shows?.length) || 0;
              const mockOrdersCount = page.ordersCount || (page.orders?.length) || 0;

              return (
                <div
                  key={page.id}
                  className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 ${isActive
                    ? 'border-gray-200 dark:border-zinc-800'
                    : 'border-gray-100 dark:border-zinc-800/50 opacity-75'
                    }`}
                >
                  {/* Status Indicator Line - أنحف وأكثر أناقة */}
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-colors ${isActive ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gray-200 dark:bg-zinc-800'}`} />

                  <div className="p-5">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-800 border-2 transition-transform duration-500 group-hover:scale-105 ${isActive ? 'border-emerald-500/20' : 'border-transparent'}`}>
                            {imgSrc ? (
                              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package size={24} />
                              </div>
                            )}
                          </div>
                          {/* نقطة الحالة مع نبض */}
                          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                            {isActive && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base truncate mb-1" title={page.product?.name}>
                            {truncate(page.product?.name, 25)}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                              {page.platform || 'General'}
                            </span>
                            <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 font-mono">
                              ID: {page.id.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid - توزيع أوضح للإحصائيات */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-gray-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 mb-1">{isRtl ? 'مشاهدات' : 'Views'}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{mockViewsCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500 mb-1">{isRtl ? 'طلبات' : 'Orders'}</p>
                        <p className="text-sm font-bold text-emerald-600">{mockOrdersCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/10 text-center">
                        <p className="text-[10px] text-emerald-600/70 mb-1">CR</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {mockViewsCount > 0 ? ((mockOrdersCount / mockViewsCount) * 100).toFixed(1) : "0"}%
                        </p>
                      </div>
                    </div>

                    {/* Platform Quick Edit - تصميم مدمج */}
                    <div className="group/edit relative flex items-center mb-5 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-transparent focus-within:border-indigo-500/50 transition-all">
                      <div className="pl-3 text-gray-400">
                        <Share2 size={14} />
                      </div>
                      <input
                        type="text"
                        value={page.platform || ''}
                        placeholder={t('platform_placeholder')}
                        onChange={(e) => setPages((prev) =>
                          prev.map((p) => (p.id === page.id ? { ...p, platform: e.target.value } : p))
                        )}
                        className="w-full px-3 py-2.5 bg-transparent text-xs outline-none dark:text-zinc-200"
                      />
                      <button
                        onClick={() => handleUpdatePlatform(page.id, page.platform)}
                        className="mr-1 p-1.5 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                      >
                        {updatingPlatformId === page.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-5 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg group/link border border-gray-100 dark:border-zinc-700/50">
                      <a
                        href={`https://${fullUrl}`}
                        target="_blank"
                        className="flex-1 truncate font-mono text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-all px-2"
                      >
                        {page.domain}
                      </a>

                      {/* إضافة أيقونة صغيرة لتعزيز فكرة أنه رابط خارجي */}
                      <div className="pr-1 text-gray-400 group-hover/link:text-blue-500 transition-colors">
                      </div>
                    </div>

                    {/* Actions Bar - أزرار دائرية ونظيفة */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(page.id, isActive)}
                          className={`p-2.5 rounded-full transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-gray-100 text-gray-400 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          <Power size={16} />
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

                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-2.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPages;