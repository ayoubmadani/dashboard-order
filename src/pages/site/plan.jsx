import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Zap, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
// import { baseURL } from '../../constents/const.';

const baseURL = "http://localhost:7000"

const PlanPage = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'plans' });
  const isRtl = i18n.dir() === 'rtl';

  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    axios
      .get(`${baseURL}/plans?active=true`)
      .then(r => setPlans(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const featuredIndex = plans.length === 3 ? 1 : 0;

  return (
    <div className="min-h-screen py-20 px-4 bg-white dark:bg-brand-dark" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black tracking-wider">
          <Sparkles size={13} /> {t('badge')}
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">
          {t('title')}
        </h1>
        <p className="text-base text-gray-500 dark:text-zinc-400 leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      {/* ── States ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <p className="text-center text-red-400 py-20 text-sm">{t('error_load')}</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-gray-400 py-20 text-sm">{t('no_plans')}</p>
      ) : (
        <div className={`max-w-5xl mx-auto grid gap-6 ${
          plans.length === 1 ? 'grid-cols-1 max-w-sm'
          : plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {plans.map((plan, idx) => {
            const isFeatured = idx === featuredIndex;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-[2rem] p-7 transition-all duration-300 ${
                  isFeatured
                    ? 'bg-zinc-900 dark:bg-white shadow-2xl scale-[1.03]'
                    : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm'
                }`}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 text-white text-[11px] font-black rounded-full shadow-lg tracking-wider">
                      <Zap size={11} /> {t('recommended')}
                    </span>
                  </div>
                )}

                {/* Name + interval */}
                <div className="mb-5 mt-1">
                  <p className={`text-xl font-black mb-2 ${isFeatured ? 'text-white dark:text-zinc-900' : 'text-gray-900 dark:text-white'}`}>
                    {t(plan.name)}
                  </p>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    isFeatured
                      ? 'bg-white/10 dark:bg-zinc-900/10 text-white dark:text-zinc-600'
                      : plan.interval === 'month'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                  }`}>
                    {plan.interval === 'month' ? t('monthly') : t('annual')}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black leading-none ${isFeatured ? 'text-white dark:text-zinc-900' : 'text-gray-900 dark:text-white'}`}>
                      {Number(plan.price).toLocaleString()}
                    </span>
                    <span className={`text-sm font-medium ms-1 ${isFeatured ? 'text-white/60 dark:text-zinc-500' : 'text-gray-400 dark:text-zinc-500'}`}>
                      {plan.currency} / {plan.interval}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className={`border-t mb-5 ${isFeatured ? 'border-white/10 dark:border-zinc-200' : 'border-gray-100 dark:border-zinc-800'}`} />

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features?.length > 0 ? (
                    plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={15}
                          className={`mt-0.5 shrink-0 ${isFeatured ? 'text-emerald-400' : 'text-emerald-500'}`}
                        />
                        <span className={`text-sm leading-snug ${isFeatured ? 'text-white/80 dark:text-zinc-700' : 'text-gray-600 dark:text-zinc-400'}`}>
                          {f}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className={`text-sm ${isFeatured ? 'text-white/30' : 'text-gray-300 dark:text-zinc-700'}`}>—</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanPage;