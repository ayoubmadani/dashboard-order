import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Gift, Loader2, Check, Sparkles } from 'lucide-react';
import { baseURL } from '../constents/const.';
import { getAccessToken } from '../services/access-token';
import { clearPlanCache } from '../services/plan';
import { getPlanPrice, buildFeatureSummary, perMonth } from '../pages/dashboard/settings/components/utils';

const DISMISS_KEY = 'trialOfferDismissed';

// عند أول دخول لحساب جديد: يعرض الخطط مع «X أيام مجاناً» وسعر التجديد، والتاجر يختار خطة التجربة
export default function TrialOffer() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const isRtl = i18n.dir() === 'rtl';
  const [offer, setOffer] = useState(null);
  const [billing, setBilling] = useState('month');
  const [autoRenew, setAutoRenew] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed) return;
    axios.get(`${baseURL}/subscription/trial`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => { if (data?.eligible && (data.plans?.length || data.freePlan)) setOffer(data); })
      .catch(() => {});
  }, []);

  if (!offer || done) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setOffer(null);
  };

  const start = async (planId) => {
    setBusy(planId);
    setError('');
    try {
      await axios.post(`${baseURL}/subscription/trial`, { planId, interval: billing, autoRenew }, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      clearPlanCache();
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
      setDone(true);
      // حدود الخطة الجديدة (متاجر، منتجات، ثيمات) تُقرأ من جديد في كل الصفحات
      window.location.reload();
    } catch (err) {
      const m = err?.response?.data?.message;
      setError((Array.isArray(m) ? m[0] : m) || t('trial_error'));
    } finally {
      setBusy(null);
    }
  };

  // بديل التجربة: الخطة المجانية يفعّلها التاجر بنفسه
  const activateFree = async () => {
    setBusy(offer.freePlan.id);
    setError('');
    try {
      await axios.post(`${baseURL}/subscription/subscribe`, { planId: offer.freePlan.id, interval: 'month' }, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      clearPlanCache();
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
      setDone(true);
      window.location.reload();
    } catch (err) {
      const m = err?.response?.data?.message;
      setError((Array.isArray(m) ? m[0] : m) || t('trial_error'));
    } finally {
      setBusy(null);
    }
  };

  const plans = offer.plans.filter((p) => getPlanPrice(p, billing) > 0);
  // الخطة الوسطى = الأكثر اختياراً
  const popularId = plans[Math.floor((plans.length - 1) / 2)]?.id;
  const period = t('sub_monthly_short');

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500"><Gift size={24} /></span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('trial_title', { days: offer.days })}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">{t('trial_subtitle')}</p>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
            {['month', 'year'].map((iv) => (
              <button key={iv} type="button" onClick={() => setBilling(iv)}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition ${billing === iv ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                {iv === 'year' ? t('sub_annual') : t('sub_monthly')}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-4 grid-cols-1 ${plans.length >= 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {plans.map((plan) => {
            const popular = plan.id === popularId && plans.length > 1;
            return (
              <div key={plan.id} className={`relative flex flex-col rounded-2xl border-2 p-5 ${popular ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-900/10' : 'border-gray-100 dark:border-zinc-800'}`}>
                {popular && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 bg-indigo-500 text-white text-[11px] font-black rounded-full whitespace-nowrap">
                    <Sparkles size={11} /> {t('trial_popular')}
                  </span>
                )}
                <p className="font-black text-lg text-gray-900 dark:text-white capitalize">{plan.name}</p>
                <p className="mt-2 text-2xl font-black text-emerald-500">{t('trial_free_days', { days: offer.days })}</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  {t('trial_then', { price: perMonth(getPlanPrice(plan, billing), billing).toLocaleString(), currency: plan.currency || 'DZD', period })}
                </p>
                {billing === 'year' && (
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {t('billed_yearly', { price: getPlanPrice(plan, 'year').toLocaleString(), currency: plan.currency || 'DZD' })}
                  </p>
                )}
                <ul className="mt-4 space-y-2 flex-1">
                  {buildFeatureSummary(plan.features, t).map(({ text }) => (
                    <li key={text} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                      <Check size={14} className="text-emerald-500 shrink-0" /> {text}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => start(plan.id)} disabled={!!busy}
                  className={`mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition active:scale-[0.98] disabled:opacity-50 ${popular ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'}`}>
                  {busy === plan.id && <Loader2 size={15} className="animate-spin" />} {t('trial_start')}
                </button>
              </div>
            );
          })}
        </div>

        {offer.freePlan && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-black text-lg text-gray-900 dark:text-white capitalize">{offer.freePlan.name}</p>
                <span className="text-sm font-black text-emerald-500">{t('free')}</span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {buildFeatureSummary(offer.freePlan.features, t).map(({ text }) => (
                  <li key={text} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-zinc-400"><Check size={13} className="text-emerald-500 shrink-0" /> {text}</li>
                ))}
              </ul>
            </div>
            <button type="button" onClick={activateFree} disabled={!!busy}
              className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition disabled:opacity-50">
              {busy === offer.freePlan.id && <Loader2 size={15} className="animate-spin" />} {t('sub_activate')}
            </button>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer rounded-2xl bg-gray-50 dark:bg-zinc-800/50 p-4">
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="mt-0.5 w-4 h-4 accent-indigo-600" />
          <span>
            <span className="block text-sm font-bold text-gray-800 dark:text-zinc-200">{t('trial_auto_renew')}</span>
            <span className="block text-xs text-gray-400 mt-0.5">{t('trial_auto_renew_hint')}</span>
          </span>
        </label>

        {error && <p className="text-sm font-semibold text-rose-500 text-center">{error}</p>}

        <button type="button" onClick={dismiss} className="w-full text-center text-sm font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
          {t('trial_skip')}
        </button>
      </div>
    </div>
  );
}
