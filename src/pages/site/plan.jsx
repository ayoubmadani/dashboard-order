import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Zap, Loader2, Sparkles, Store, Package, FileText, Bell, TrendingUp } from 'lucide-react';
import axios from 'axios';

const baseURL = "http://localhost:7000";

// ─── Feature row builder من FeaturesEntity ───────────────────────────────────
const buildFeatureRows = (features, t) => {
  if (!features) return [];
  const rows = [
    { icon: Store,      label: t('feat_stores'),   value: features.storeNumber },
    { icon: Package,    label: t('feat_products'),  value: features.productNumber },
    { icon: FileText,   label: t('feat_pages'),     value: features.landingPageNumber },
    { icon: TrendingUp, label: t('feat_commission'),value: `${Number(features.commission ?? 0).toFixed(1)}%` },
  ];
  if (features.isNtfy)
    rows.push({ icon: Bell, label: t('feat_notifications'), value: '✓' });
  if (features.pixelFacebookNumber > 0 || features.pixelTiktokNumber > 0)
    rows.push({ icon: null, label: `FB ×${features.pixelFacebookNumber} · TT ×${features.pixelTiktokNumber}`, value: null });
  return rows;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const PlanPage = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'plans' });
  const isRtl = i18n.dir() === 'rtl';

  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [interval, setInterval] = useState('month'); // 'month' | 'year'

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

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
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

      {/* Interval toggle */}
      {!loading && !error && plans.length > 0 && (
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1">
            <button
              onClick={() => setInterval('month')}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-colors ${
                interval === 'month'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-zinc-500'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${
                interval === 'year'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-400 dark:text-zinc-500'
              }`}
            >
              {t('annual')}
              {/* savings badge — يحسب متوسط التوفير على جميع الخطط */}
              {(() => {
                const paid = plans.filter(p => p.monthlyPrice > 0 && p.yearlyPrice > 0);
                if (!paid.length) return null;
                const avg = Math.round(
                  paid.reduce((acc, p) =>
                    acc + (1 - Number(p.yearlyPrice) / (Number(p.monthlyPrice) * 12)), 0
                  ) / paid.length * 100
                );
                return avg > 0
                  ? <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">{t('save_up_to', { pct: avg })}</span>
                  : null;
              })()}
            </button>
          </div>
        </div>
      )}

      {/* States */}
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
            const price = interval === 'year'
              ? Number(plan.yearlyPrice)
              : Number(plan.monthlyPrice);

            // حساب التوفير لهذه الخطة تحديداً
            const savings = plan.monthlyPrice > 0 && plan.yearlyPrice > 0
              ? Math.round((1 - Number(plan.yearlyPrice) / (Number(plan.monthlyPrice) * 12)) * 100)
              : 0;

            const featureRows = buildFeatureRows(plan.features, t);
            const isFree = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;

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

                {/* Name */}
                <div className="mb-5 mt-1">
                  <p className={`text-xl font-black mb-2 ${isFeatured ? 'text-white dark:text-zinc-900' : 'text-gray-900 dark:text-white'}`}>
                    {t(plan.name)}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    {isFree ? (
                      <span className={`text-4xl font-black leading-none ${isFeatured ? 'text-white dark:text-zinc-900' : 'text-gray-900 dark:text-white'}`}>
                        {t('free')}
                      </span>
                    ) : (
                      <>
                        <span className={`text-4xl font-black leading-none ${isFeatured ? 'text-white dark:text-zinc-900' : 'text-gray-900 dark:text-white'}`}>
                          {price.toLocaleString()}
                        </span>
                        <span className={`text-sm font-medium ms-1 ${isFeatured ? 'text-white/60 dark:text-zinc-500' : 'text-gray-400 dark:text-zinc-500'}`}>
                          {plan.currency} / {interval === 'year' ? t('yr') : t('mo')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Savings badge (yearly only) */}
                  {interval === 'year' && savings > 0 && (
                    <p className="mt-2 text-[11px] font-bold text-emerald-500">
                      {t('save_pct', { pct: savings })}
                    </p>
                  )}
                </div>

                <div className={`border-t my-5 ${isFeatured ? 'border-white/10 dark:border-zinc-200' : 'border-gray-100 dark:border-zinc-800'}`} />

                {/* Feature rows */}
                <ul className="space-y-3 flex-1">
                  {featureRows.length > 0 ? featureRows.map((row, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      {row.icon ? (
                        <row.icon size={14} className={`shrink-0 ${isFeatured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      ) : (
                        <CheckCircle2 size={14} className={`shrink-0 ${isFeatured ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      )}
                      <span className={`text-sm leading-snug ${isFeatured ? 'text-white/80 dark:text-zinc-700' : 'text-gray-600 dark:text-zinc-400'}`}>
                        {row.value !== null && row.value !== '✓'
                          ? <><strong>{row.value}</strong> {row.label}</>
                          : row.label
                        }
                      </span>
                    </li>
                  )) : (
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