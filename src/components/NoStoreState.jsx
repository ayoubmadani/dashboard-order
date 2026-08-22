import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowRight, ArrowLeft } from 'lucide-react';

export default function NoStoreState({ title, subtitle, cta, isRtl }) {
  const CtaArrow = isRtl ? ArrowLeft : ArrowRight;
  return (
    <div className="min-h-[calc(100vh-100px)] bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="text-center max-w-md w-full p-10 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Store size={32} className="text-white" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-7 leading-relaxed">{subtitle}</p>
        <Link
          to="/dashboard/settings/stores/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {cta}
          <CtaArrow size={16} />
        </Link>
      </div>
    </div>
  );
}
