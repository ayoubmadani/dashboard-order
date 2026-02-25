import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Rocket, Plus, ExternalLink, Copy,
  Edit3, Trash2, MousePointerClick,
  BarChart, Search, ChevronRight, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPages = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [copiedId, setCopiedId] = useState(null);

  // بيانات تجريبية لصفحات الهبوط
  const [pages] = useState([
    {
      id: 1,
      title: "عرض هاتف X1 المحدود",
      url: "/lp/phone-x1-offer",
      views: 1240,
      conversions: 85,
      status: 'published'
    },
    {
      id: 2,
      title: "تخفيضات السماعات اللاسلكية",
      url: "/lp/airpods-sale",
      views: 850,
      conversions: 32,
      status: 'draft'
    }
  ]);

  const handleCopyLink = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    // منطق نسخ الرابط الفعلي يوضع هنا
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
          to={'/dashboard/landing-pages/create'}
        >
          <Plus size={20} />
          {t('landing.create_new', 'إنشاء صفحة جديدة')}
        </Link>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group transition-all">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <MousePointerClick size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em]">{t('landing.total_views', 'إجمالي الزيارات')}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">2,090</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group transition-all">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <BarChart size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em]">{t('landing.total_conv', 'إجمالي التحويلات')}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">117</p>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="grid grid-cols-1 gap-4">
        {pages.map((page) => (
          <div key={page.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:border-rose-100 dark:hover:border-rose-500/30 transition-all group overflow-hidden relative">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{page.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${page.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/20'
                      : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 border-gray-100 dark:border-zinc-700'
                    }`}>
                    {page.status === 'published' ? t('common.published', 'منشورة') : t('common.draft', 'مسودة')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500 text-sm">
                  <span className="font-mono truncate max-w-[180px] md:max-w-md bg-gray-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-zinc-800">
                    mdstore.dz{page.url}
                  </span>
                  <button
                    onClick={() => handleCopyLink(page.id)}
                    className={`p-1.5 rounded-lg transition-all ${copiedId === page.id ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`}
                  >
                    {copiedId === page.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-8 px-8 lg:border-x border-gray-100 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t('landing.views', 'الزيارات')}</p>
                  <p className="font-black text-gray-900 dark:text-white text-xl">{page.views.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t('landing.conv', 'التحويل')}</p>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-xl">{page.conversions.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-black rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-600">
                  <Edit3 size={18} />
                  {t('common.edit', 'تعديل')}
                </button>
                <div className="flex items-center gap-1">
                  <button className="p-3 text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-2xl hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-100 dark:shadow-none">
                    <Trash2 size={18} />
                  </button>
                  <button className="p-3 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-all">
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>

            </div>

            {/* تأثير خلفية بسيط للتحويم */}
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-rose-50/20 dark:from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

    </div>
  );
};

export default LandingPages;