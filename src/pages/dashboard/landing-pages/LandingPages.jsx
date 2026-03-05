import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Rocket, Plus, ExternalLink, Copy,
  Edit3, Trash2, MousePointerClick,
  BarChart, CheckCircle2, Loader2, AlertCircle,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const getProductImage = (page) =>
  page.urlImage ||
  page.product?.productImage ||
  page.product?.imagesProduct?.[0]?.imageUrl ||
  null;

const LandingPages = () => {
  const { t, i18n } = useTranslation();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const token = getAccessToken();
  const storeId = localStorage.getItem('storeId');

  /* ── Fetch ── */
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${baseURL}/landing-page/store/${storeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log({ data: res.data });

        setPages(Array.isArray(res.data) ? res.data : res.data.data ?? []);
      } catch (err) {
        console.error('Failed to fetch landing pages:', err);
        setError(err?.response?.data?.message || 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  /* ── Copy link ── */
  const handleCopyLink = (page) => {
    const url = `${window.location.origin}/lp/${page.domain}`;
    navigator.clipboard.writeText(url).catch(() => { });
    setCopiedId(page.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm(t('landing.confirm_delete', 'هل أنت متأكد من حذف هذه الصفحة؟'))) return;
    setDeletingId(id);
    try {
      await axios.delete(`${baseURL}/landing-page/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPages(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert(t('landing.delete_error', 'فشل حذف الصفحة'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 transition-colors">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Rocket size={24} />
            </div>
            {t('dashboard.landing', 'صفحات الهبوط')}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1 max-w-xl font-medium">
            {t('landing.desc', 'أنشئ صفحات بيع احترافية لزيادة مبيعات منتجاتك المميزة.')}
          </p>
        </div>
        <Link
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          to="/dashboard/landing-pages/create"
        >
          <Plus size={20} />
          {t('landing.create_new', 'إنشاء صفحة جديدة')}
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group transition-all">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <MousePointerClick size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
              {t('landing.total_pages', 'إجمالي الصفحات')}
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {loading ? '—' : pages.length.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group transition-all">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <BarChart size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
              {t('landing.platforms', 'المنصات المستخدمة')}
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {loading ? '—' : [...new Set(pages.map(p => p.platform).filter(Boolean))].length}
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-500/20">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && pages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
            <Rocket size={28} />
          </div>
          <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">
            {t('landing.no_pages', 'لا توجد صفحات بعد')}
          </h3>
          <p className="text-gray-400 dark:text-zinc-500 text-sm mb-6">
            {t('landing.no_pages_desc', 'أنشئ أول صفحة هبوط لمنتجاتك الآن')}
          </p>
          <Link
            to="/dashboard/landing-pages/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            {t('landing.create_new', 'إنشاء صفحة جديدة')}
          </Link>
        </div>
      )}

      {/* Pages list */}
      {!loading && !error && pages.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {pages.map(page => {
            const imgSrc = getProductImage(page);
            const lpUrl = `/lp/${page.domain}`;
            const fullUrl = `${storeURL}${lpUrl}`;

            return (
              <div
                key={page.id}
                className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:border-rose-100 dark:hover:border-rose-500/30 transition-all group overflow-hidden relative"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">

                  {/* Left: image + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0 border border-gray-100 dark:border-zinc-700">
                      {imgSrc ? (
                        <img src={imgSrc} alt={page.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={24} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-black text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-xs">
                          {page.product?.name || page.domain}
                        </h3>
                        {page.platform && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20">
                            {page.platform}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 font-mono text-xs bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 transition-all duration-200 hover:text-gray-900 dark:hover:text-zinc-100 shadow-sm hover:shadow"
                        >
                          <span className="truncate max-w-[140px] md:max-w-sm">
                            {fullUrl}
                          </span>

                          {/* أيقونة السهم الخارجي التي تظهر بوضوح عند الـ Hover */}
                          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                        <button
                          onClick={() => handleCopyLink(page)}
                          className={`p-1.5 rounded-lg transition-all shrink-0 ${copiedId === page.id
                              ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                              : 'text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                            }`}
                          title={t('common.copy_link', 'نسخ الرابط')}
                        >
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Center: price */}
                  <div className="flex items-center gap-8 px-8 lg:border-x border-gray-100 dark:border-zinc-800">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                        {t('landing.price', 'السعر')}
                      </p>
                      <p className="font-black text-gray-900 dark:text-white text-lg">
                        {page.product?.price
                          ? `${parseFloat(String(page.product.price)).toLocaleString('ar-DZ')} د.ج`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/dashboard/landing-pages/edit/${page.id}`}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-black rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-600 text-sm"
                    >
                      <Edit3 size={16} />
                      {t('common.edit', 'تعديل')}
                    </Link>

                    <button
                      onClick={() => handleDelete(page.id)}
                      disabled={deletingId === page.id}
                      className="p-3 text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-2xl hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-100 dark:shadow-none disabled:opacity-50"
                      title={t('common.delete', 'حذف')}
                    >
                      {deletingId === page.id
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Trash2 size={16} />}
                    </button>

                    <a
                      href={lpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-all"
                      title={t('common.open', 'فتح الصفحة')}
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>

                {/* Hover glow */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-rose-50/20 dark:from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default LandingPages;