import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2, CheckCircle2, CalendarDays, Zap, ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import CouponInput from '../../../../components/CouponInput';
import SectionTitle from './SectionTitle';
import { isFree, getPlanPrice, getDiscountedPrice, buildFeatureSummary } from './utils';

export default function SubscriptionTab() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const isRtl = i18n.dir() === 'rtl';
  const token = getAccessToken();

  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscribing, setSubscribing] = useState(null);
  const [subInterval, setSubInterval] = useState('year');
  const [subToast, setSubToast] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [confirmUpgrade, setConfirmUpgrade] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    setSubLoading(true);
    axios.get(`${baseURL}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setSubscription(r.data ?? null))
      .catch(() => setSubscription(null))
      .finally(() => setSubLoading(false));
  }, [token]);

  useEffect(() => {
    axios.get(`${baseURL}/plans?active=true`).then(r => setPlans(r.data)).catch(() => {});
  }, []);

  const showSubToast = (msg, type = 'success') => {
    setSubToast({ msg, type });
    setTimeout(() => setSubToast(null), 3500);
  };

  const handleSubscribe = async (planId, interval = 'month') => {
    setSubscribing(planId);
    try {
      const endpoint = subscription
        ? `${baseURL}/subscription/upgrade`
        : `${baseURL}/subscription/subscribe`;
      const couponCodeToSend = couponInfo ? couponCode.trim() : undefined;
      await axios.post(endpoint, { planId, interval, couponCode: couponCodeToSend }, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get(`${baseURL}/subscription/my`, { headers: { Authorization: `Bearer ${token}` } });
      setSubscription(data);
      setShowSubModal(false);
      if (window.gtag) {
        const plan = plans.find(p => p.id === planId);
        const basePrice = plan ? getPlanPrice(plan, interval) : 0;
        const finalPrice = couponInfo ? getDiscountedPrice(basePrice, couponInfo) : basePrice;
        window.gtag('event', 'purchase', {
          transaction_id: `sub-${planId}-${Date.now()}`,
          value: finalPrice,
          currency: 'DZD',
          items: [{ item_id: planId, item_name: plan?.name || 'Subscription Plan', item_category: 'subscription' }],
        });
      }
      setCouponCode(''); setCouponInfo(null); setCouponError('');
      showSubToast(t('sub_success'), 'success');
    } catch (err) {
      setShowSubModal(false);
      showSubToast(err?.response?.data?.message || t('sub_error'), 'error');
    } finally { setSubscribing(null); }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponChecking(true); setCouponError(''); setCouponInfo(null);
    try {
      const { data } = await axios.post(`${baseURL}/coupons/validate`,
        { code: couponCode.trim(), scope: 'plan' },
        { headers: { Authorization: `Bearer ${token}` } });
      setCouponInfo(data);
    } catch (err) {
      setCouponError(err?.response?.data?.message || t('coupon_invalid'));
    } finally { setCouponChecking(false); }
  };

  const handleClearCoupon = () => {
    setCouponCode(''); setCouponInfo(null); setCouponError('');
  };

  const handleAutoRenew = async () => {
    const next = !subscription.autoRenew;
    setSubscription(prev => ({ ...prev, autoRenew: next }));
    try {
      await axios.patch(`${baseURL}/subscription/my/auto-renew`, { autoRenew: next }, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      setSubscription(prev => ({ ...prev, autoRenew: !next }));
      showSubToast(t('sub_error'), 'error');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });
  const daysLeft = (endDate) => Math.max(0, Math.ceil((new Date(endDate) - new Date()) / 86400000));
  const currentMonthlyPrice = subscription ? getPlanPrice(subscription.plan, 'month') : 0;
  const upgradeablePlans = plans.filter(
    p => !isFree(p) && p.id !== subscription?.plan?.id && getPlanPrice(p, 'month') > currentMonthlyPrice,
  );

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
        <SectionTitle>{t('tab_subscription')}</SectionTitle>

        {subLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
        ) : !subscription ? (
          <div className="space-y-5">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{t('sub_no_plan_hint')}</p>
            {plans.length > 0 && (
              <CouponInput
                code={couponCode}
                onCodeChange={setCouponCode}
                onApply={handleApplyCoupon}
                onClear={handleClearCoupon}
                checking={couponChecking}
                error={couponError}
                appliedText={couponInfo ? t('coupon_applied', {
                  value: couponInfo.discountType === 'percentage' ? `${couponInfo.discountValue}%` : `${couponInfo.discountValue} DZD`,
                }) : ''}
                placeholder={t('coupon_placeholder')}
                applyLabel={t('coupon_apply')}
              />
            )}
            {plans.length === 0
              ? <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-8">{t('sub_no_available_plans')}</p>
              : (
                <div className="space-y-3">
                  <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
                    {['year', 'month'].map(iv => (
                      <button key={iv} onClick={() => setSubInterval(iv)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${subInterval === iv ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>
                        {iv === 'month' ? t('sub_monthly') : t('sub_annual')}
                      </button>
                    ))}
                  </div>
                  {plans.map(plan => {
                    const price = getPlanPrice(plan, subInterval);
                    const discountedPrice = getDiscountedPrice(price, couponInfo);
                    const hasDiscount = couponInfo && !isFree(plan) && discountedPrice < price;
                    const savings = plan.monthlyPrice > 0 ? Math.round((1 - Number(plan.yearlyPrice) / (Number(plan.monthlyPrice) * 12)) * 100) : 0;
                    return (
                      <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                            <Zap size={16} className="text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                              {isFree(plan)
                                ? <span className="font-bold text-emerald-500">{t('free')}</span>
                                : hasDiscount
                                  ? <>
                                      <span className="line-through me-1.5">{price.toLocaleString()}</span>
                                      <span className="font-bold text-emerald-500">{discountedPrice.toLocaleString()} {plan.currency}</span> / {subInterval === 'month' ? t('sub_monthly') : t('sub_annual')}
                                    </>
                                  : <><span className="font-bold text-gray-700 dark:text-zinc-300">{price.toLocaleString()} {plan.currency}</span> / {subInterval === 'month' ? t('sub_monthly') : t('sub_annual')}</>
                              }
                            </p>
                            {!isFree(plan) && subInterval === 'year' && savings > 0 && (
                              <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{t('save_pct', { pct: savings })}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSubscribe(plan.id, subInterval)}
                          disabled={!!subscribing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                        >
                          {subscribing === plan.id ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} />}
                          {t('sub_activate')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Zap size={20} className="text-indigo-500" />
                </div>
                <div>
                  <p className="font-black text-lg text-gray-900 dark:text-white leading-tight">{subscription.plan.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                    {subscription.interval === 'month' ? t('sub_monthly') : t('sub_annual')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-full">
                <CheckCircle2 size={12} /> {t('sub_active')}
              </span>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t('sub_price')}</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {isFree(subscription.plan)
                    ? <span className="text-emerald-500">{t('free')}</span>
                    : <>{getPlanPrice(subscription.plan, subscription.interval).toLocaleString()}<span className="text-sm font-medium text-gray-400 dark:text-zinc-500 ms-1">{subscription.plan.currency} / {subscription.interval === 'year' ? t('sub_annual_short') : t('sub_monthly_short')}</span></>
                  }
                </p>
                {upgradeablePlans.length > 0 && (
                  <button onClick={() => { handleClearCoupon(); setShowSubModal(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 shrink-0">
                    <Zap size={13} /> {t('sub_upgrade')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[{ label: t('sub_start_date'), value: formatDate(subscription.startDate) }, { label: t('sub_end_date'), value: formatDate(subscription.endDate) }].map(item => (
                <div key={item.label} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CalendarDays size={11} /> {item.label}</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">{item.value}</p>
                </div>
              ))}
            </div>

            {(() => {
              const total = new Date(subscription.endDate) - new Date(subscription.startDate);
              const elapsed = new Date() - new Date(subscription.startDate);
              const pct = Math.min(100, Math.round((elapsed / total) * 100));
              const left = daysLeft(subscription.endDate);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-zinc-500">
                    <span>{t('sub_days_left')}</span>
                    <span className={left <= 7 ? 'text-red-400' : 'text-emerald-500'}>{left} {t('sub_days')}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })()}

            {subscription.plan.features && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{t('sub_features')}</p>
                <div className="flex flex-wrap gap-2">
                  {buildFeatureSummary(subscription.plan.features, t).map(({ icon: Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl">
                      <Icon size={11} /> {text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isFree(subscription.plan) && (
              <div onClick={handleAutoRenew} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer">
                <div>
                  <p className="font-black text-sm text-gray-800 dark:text-white">{t('sub_auto_renew')}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{subscription.autoRenew ? t('sub_auto_renew_on') : t('sub_auto_renew_off')}</p>
                </div>
                <div className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${subscription.autoRenew ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${subscription.autoRenew ? (isRtl ? 'right-6' : 'left-6') : (isRtl ? 'right-1' : 'left-1')}`} />
                </div>
              </div>
            )}
          </div>
        )}

        {subToast && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold mt-2 ${subToast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
            {subToast.type === 'success' ? <CheckCircle2 size={15} /> : <span>✕</span>}
            {subToast.msg}
          </div>
        )}
      </div>

      {/* ── Upgrade Modal ── */}
      {showSubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowSubModal(false); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><Zap size={15} className="text-indigo-500" /></div>
                <h2 className="font-black text-gray-900 dark:text-white text-base">{t('sub_upgrade')}</h2>
              </div>
              <button onClick={() => setShowSubModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-lg font-bold">✕</button>
            </div>
            <p className="px-6 pb-2 text-xs text-gray-400 dark:text-zinc-500">{t('sub_current_label')}: <span className="font-bold text-gray-600 dark:text-zinc-300">{subscription?.plan?.name}</span></p>
            <div className="px-6 pb-4">
              <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
                {['year', 'month'].map(iv => (
                  <button key={iv} onClick={() => setSubInterval(iv)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${subInterval === iv ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}>
                    {iv === 'month' ? t('sub_monthly') : t('sub_annual')}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 pb-4">
              <CouponInput
                code={couponCode}
                onCodeChange={setCouponCode}
                onApply={handleApplyCoupon}
                onClear={handleClearCoupon}
                checking={couponChecking}
                error={couponError}
                appliedText={couponInfo ? t('coupon_applied', {
                  value: couponInfo.discountType === 'percentage' ? `${couponInfo.discountValue}%` : `${couponInfo.discountValue} DZD`,
                }) : ''}
                placeholder={t('coupon_placeholder')}
                applyLabel={t('coupon_apply')}
              />
            </div>
            <div className="px-6 pb-6 space-y-3">
              {upgradeablePlans.map(plan => {
                const price = getPlanPrice(plan, subInterval);
                const discountedPrice = getDiscountedPrice(price, couponInfo);
                const hasDiscount = couponInfo && discountedPrice < price;
                const savings = plan.monthlyPrice > 0 ? Math.round((1 - Number(plan.yearlyPrice) / (Number(plan.monthlyPrice) * 12)) * 100) : 0;
                const featureRows = buildFeatureSummary(plan.features, t);
                return (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                    <div>
                      <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                        {hasDiscount
                          ? <>
                              <span className="line-through me-1.5">{price.toLocaleString()}</span>
                              <span className="font-bold text-emerald-500">{discountedPrice.toLocaleString()} {plan.currency}</span>
                            </>
                          : <span className="font-bold text-gray-700 dark:text-zinc-300">{price.toLocaleString()} {plan.currency}</span>
                        }
                        {' / '}{subInterval === 'month' ? t('sub_monthly') : t('sub_annual')}
                      </p>
                      {subInterval === 'year' && savings > 0 && <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{t('save_pct', { pct: savings })}</p>}
                      {featureRows.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {featureRows.slice(0, 3).map(({ icon: Icon, text }) => (
                            <span key={text} className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg font-semibold inline-flex items-center gap-1"><Icon size={9} /> {text}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmUpgrade({ plan, price, discountedPrice, hasDiscount })}
                      disabled={!!subscribing}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl active:scale-95 disabled:opacity-50 transition-all shrink-0 ms-3"
                    >
                      {subscribing === plan.id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                      {t('sub_activate')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade Confirm Modal ── */}
      {confirmUpgrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={e => { if (e.target === e.currentTarget && !subscribing) setConfirmUpgrade(null); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-sm shadow-2xl p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
              <Zap size={20} className="text-indigo-500" />
            </div>
            <h3 className="text-base font-black text-center text-gray-900 dark:text-white mb-1">
              {t('upgrade_confirm_title')}
            </h3>
            <p className="text-sm text-center text-gray-500 dark:text-zinc-400 mb-4">
              {t('upgrade_confirm_desc', {
                plan: confirmUpgrade.plan.name,
                price: (confirmUpgrade.hasDiscount ? confirmUpgrade.discountedPrice : confirmUpgrade.price).toLocaleString(),
                currency: confirmUpgrade.plan.currency,
              })}
            </p>
            <p className="text-[11px] text-center text-gray-400 dark:text-zinc-500 mb-5">
              {t('upgrade_confirm_proration_note')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUpgrade(null)}
                disabled={!!subscribing}
                className="flex-1 px-4 py-2.5 text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
              >
                {t('upgrade_confirm_cancel')}
              </button>
              <button
                onClick={async () => { const p = confirmUpgrade.plan; setConfirmUpgrade(null); await handleSubscribe(p.id, subInterval); }}
                disabled={!!subscribing}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black text-sm active:scale-95 disabled:opacity-50 transition-all"
              >
                {subscribing === confirmUpgrade.plan.id && <Loader2 size={14} className="animate-spin" />}
                {t('upgrade_confirm_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
