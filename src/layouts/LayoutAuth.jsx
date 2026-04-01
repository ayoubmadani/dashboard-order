import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Globe2 } from 'lucide-react';

// ... (الواردات تبقى كما هي)

const LayoutAuth = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div
      // التعديل هنا: أضفنا bg-gray-50 للوضع الفاتح و keep dark:bg-brand-dark للوضع الليلي
      className="min-h-screen w-full flex bg-gray-100 dark:bg-brand-dark p-4 md:p-5 transition-colors duration-500"
      dir={isRtl ? 'rtl' : 'ltr'}
    >

      {/* القسم الملون (Branding Section) - يظهر في الشاشات الكبيرة */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-primary via-indigo-600 to-purple-700 
        ${isRtl ? 'rounded-r-[2.5rem]' : 'rounded-l-[2.5rem]'} shadow-2xl transition-all duration-700`}>

        {/* زر العودة للموقع */}
        <Link
          to="/"
          className={`absolute top-10 ${isRtl ? 'right-10' : 'left-10'} z-20 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full hover:bg-white/20 transition-all group`}
        >
          {isRtl ?
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> :
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          }
          <span className="text-sm font-bold tracking-tight">{t('auth.back_home', 'العودة للرئيسية')}</span>
        </Link>

        {/* أيقونة ديكورية كبيرة في الخلفية */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <Globe2 size={400} strokeWidth={0.5} className="text-white" />
        </div>

        {/* المحتوى النصي الملهم */}
        <div className="relative z-10 mt-auto p-16 text-white w-full">
          <div className="flex items-center gap-2 mb-4 opacity-70">
            <div className="w-8 h-[2px] bg-white"></div>
            <p className="text-xs font-black tracking-[0.2em] uppercase">MdStore Ecosystem</p>
          </div>
          <h2 className="text-5xl font-black leading-[1.1] mb-6 tracking-tight">
            {t('auth.quote_title_1', 'كل ما تحتاجه')} <br />
            {t('auth.quote_title_2', 'لتنمية تجارتك')} <br />
            <span className="text-white/50">{t('auth.quote_title_3', 'في مكان واحد.')}</span>
          </h2>
          <p className="text-lg opacity-80 max-w-md leading-relaxed font-medium">
            {t('auth.hero_desc', 'انضم إلى آلاف التجار الذين يثقون في MdStore لإدارة مبيعاتهم ونمو أعمالهم يومياً.')}
          </p>
        </div>

        {/* خطوط الـ SVG الديكورية */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path d="M0,100 C150,200 250,0 400,100" stroke="white" fill="transparent" strokeWidth="1" />
            <path d="M0,200 C150,300 250,100 400,200" stroke="white" fill="transparent" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* القسم الأبيض/الداكن - تم تحسين تفاعله مع الألوان */}
      <div className={`w-full lg:w-1/2 bg-white dark:bg-zinc-950 flex items-center justify-center p-8 relative 
        ${isRtl ? 'rounded-l-[2.5rem] lg:rounded-r-none' : 'rounded-r-[2.5rem] lg:rounded-l-none'} 
        rounded-[2.5rem] transition-all duration-500 shadow-inner border border-gray-100 dark:border-none`}>

        {/* الشعار - تأكد من أن النص يتغير لونه */}
        <Link to="/" className={`absolute top-10 ${isRtl ? 'left-10' : 'right-10'} flex items-center gap-2 group`}>
          <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter italic transition-colors">MdStore</span>
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-brand-primary/20">
            <span className="text-white text-xs font-bold font-sans">M</span>
          </div>
        </Link>

        <div className="w-full max-w-sm text-gray-900 dark:text-white">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default LayoutAuth;