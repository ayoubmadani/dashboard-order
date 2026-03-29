import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon, User, Bell,
  Globe, Save, Moon, Sun, Loader2, ExternalLink,
  CreditCard, CheckCircle2, CalendarDays, Zap, ChevronRight,
  Store, Package, FileText, TrendingUp,
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// ─── helpers ─────────────────────────────────────────────────────────────────

const isFree = (plan) =>
  Number(plan?.monthlyPrice ?? 0) === 0 && Number(plan?.yearlyPrice ?? 0) === 0;

const getPlanPrice = (plan, interval) =>
  interval === 'year' ? Number(plan?.yearlyPrice ?? 0) : Number(plan?.monthlyPrice ?? 0);

const buildFeatureSummary = (features, t) => {
  if (!features) return [];
  const rows = [];
  if (features.storeNumber) rows.push({ icon: Store, text: `${features.storeNumber} ${t('feat_stores')}` });
  if (features.productNumber) rows.push({ icon: Package, text: `${features.productNumber} ${t('feat_products')}` });
  if (features.landingPageNumber) rows.push({ icon: FileText, text: `${features.landingPageNumber} ${t('feat_pages')}` });
  if (Number(features.commission) > 0)
    rows.push({ icon: TrendingUp, text: `${Number(features.commission).toFixed(1)}% ${t('feat_commission')}` });
  return rows;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Settings = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const token = getAccessToken();

  // ✅ user من context بدل re-fetch /user/current-user
  const { user: contextUser } = useOutletContext();

  const [userData, setUserData] = useState({
    username: contextUser?.name || '',
    email: contextUser?.email || '',
    provider: '',
    topic: '',
    isNtfy: true,
  });

  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscribing, setSubscribing] = useState(null);
  const [subInterval, setSubInterval] = useState('month'); // interval picker for upgrade modal
  const [subToast, setSubToast] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loadSaveChange, setLoadSaveChange] = useState(false);
  const [loadToggle, setLoadToggle] = useState(false);


  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const isRtl = i18n.dir() === 'rtl';

  // ✅ sync userData من context عند تغير user (بدل axios call منفصل)
  useEffect(() => {
    if (contextUser?.name) {
      setUserData(prev => ({
        ...prev,
        username: contextUser.name,
        email: contextUser.email || prev.email,
      }));
    }
  }, [contextUser]);

  // ── جلب topic و isNtfy — بيانات إضافية غير موجودة في context ──
  useEffect(() => {
    if (!token) return;
    axios.get(`${baseURL}/user/current-user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUserData(prev => ({
        ...prev,
        provider: data.provider || '',
        topic: data.topic || '',
        isNtfy: data.isNtfy ?? prev.isNtfy,
      })))
      .catch(console.error);
  }, [token]);

  /* ── Fetch subscription ── */
  useEffect(() => {
    if (activeTab !== 'subscription' || subscription !== null) return;
    const fetchSub = async () => {
      setSubLoading(true);
      try {
        const { data } = await axios.get(`${baseURL}/subscription/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubscription(data ?? null);
      } catch {
        setSubscription(null);
      } finally {
        setSubLoading(false);
      }
    };
    fetchSub();
  }, [activeTab, token, subscription]);

  /* ── Fetch plans (lazy, once) ── */
  useEffect(() => {
    if (activeTab !== 'subscription' || plans.length > 0) return;
    axios.get(`${baseURL}/plans?active=true`).then(r => setPlans(r.data)).catch(() => { });
  }, [activeTab, plans.length]);

  /* ── Subscribe ── */
  // interval مطلوب الآن لاختيار السعر الصحيح
  const handleSubscribe = async (planId, interval = 'month') => {
    setSubscribing(planId);
    try {
      await axios.post(
        `${baseURL}/subscription/subscribe`,
        { planId, interval },           // ← interval مُضاف
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { data } = await axios.get(`${baseURL}/subscription/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(data);
      setShowSubModal(false);
      showSubToast(t('sub_success'), 'success');
    } catch (err) {
      alert(err?.response?.data?.message || t('sub_error'), 'error')
      setShowSubModal(false);
      showSubToast(err?.response?.data?.message || t('sub_error'), 'error');
    } finally {
      setSubscribing(null);
    }
  };

  const showSubToast = (msg, type = 'success') => {
    setSubToast({ msg, type });
    setTimeout(() => setSubToast(null), 3500);
  };

  /* ── Toggle autoRenew ── */
  const handleAutoRenew = async () => {
    const next = !subscription.autoRenew;
    setSubscription(prev => ({ ...prev, autoRenew: next }));
    try {
      await axios.patch(
        `${baseURL}/subscription/my/auto-renew`,
        { autoRenew: next },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      setSubscription(prev => ({ ...prev, autoRenew: !next }));
      showSubToast(t('sub_error'), 'error');
    }
  };

  /* ── Dark mode ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  /* ── Save ── */
  const handleSave = async () => {
    setLoadSaveChange(true);
    try {
      await axios.patch(
        `${baseURL}/user`,
        { topic: userData.topic },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoadSaveChange(false);
    }
  };

  const toggleNtfy = async () => {
    setLoadToggle(true)
    try {
      // لاحظ إضافة {} كباراميتر ثاني للبيانات (Body)
      const res = await axios.post(
        `${baseURL}/user/toggle-ntfy`,
        {}, // البيانات المرسلة في الجسم (فارغة في حالتك)
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUserData({ ...userData, isNtfy: res.data })
      console.log("Response:", res.data);
      // يمكنك هنا تحديث حالة الواجهة (UI) بناءً على النتيجة

    } catch (error) {
      confirm(error.response?.data.message)
    } finally {
      setLoadToggle(false)
    }
  };

  const tabs = [
    { id: 'profile', label: t('tab_profile'), icon: <User size={18} /> },
    { id: 'store', label: t('tab_preferences'), icon: <Globe size={18} /> },
    { id: 'notifications', label: t('tab_notifications'), icon: <Bell size={18} /> },
    { id: 'subscription', label: t('tab_subscription'), icon: <CreditCard size={18} /> },
  ];

  const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:border-indigo-400 transition-all dark:text-white';
  const disabledInputCls = 'w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed text-sm';
  const SectionTitle = ({ children }) => (
    <h3 className="text-base font-black dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6">{children}</h3>
  );

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });

  const daysLeft = (endDate) =>
    Math.max(0, Math.ceil((new Date(endDate) - new Date()) / 86400000));

  const showSaveButton = activeTab !== 'subscription';

  // الخطط المدفوعة فقط في modal الترقية
  const upgradeablePlans = plans.filter(p => !isFree(p) && p.id !== subscription?.plan?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl">
          <SettingsIcon size={22} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar */}
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
                : 'bg-white dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-6">

          {/* ─── Profile ─── */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <SectionTitle>{t('personal_info')}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('username')}</label>
                  <input type="text" disabled value={userData.username} className={disabledInputCls} />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('email')}</label>
                  <input type="email" disabled value={userData.email} className={disabledInputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Preferences ─── */}
          {activeTab === 'store' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <SectionTitle>{t('platform_pref')}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Globe size={14} />{t('language')}
                  </label>
                  <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="ar">{t('lang_ar')}</option>
                    <option value="en">{t('lang_en')}</option>
                    <option value="fr">{t('lang_fr')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Moon size={14} />{t('mode')}
                  </label>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl font-bold transition-all hover:border-gray-300 dark:hover:border-zinc-600"
                  >
                    <span className="text-sm dark:text-zinc-300">{isDark ? t('dark') : t('light')}</span>
                    {isDark ? <Moon size={18} className="text-yellow-400" /> : <Sun size={18} className="text-orange-500" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Notifications ─── */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                <h3 className="text-base font-black dark:text-white">{t('notif_title')}</h3>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded-full tracking-wider">Ntfy.sh</span>
              </div>
              <div className="space-y-3 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <label className="flex items-center gap-2 text-sm font-bold dark:text-zinc-300">
                  <Bell size={15} className="dark:text-white" />{t('notif_topic_label')}
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={t('notif_topic_placeholder')}
                      value={userData.topic}
                      dir="ltr"
                      onChange={(e) => setUserData({ ...userData, topic: e.target.value })}
                      className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-indigo-400 dark:text-white font-mono text-sm transition-all pr-10"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={loadSaveChange}
                    className={`
                    relative px-8 py-3 text-sm font-black rounded-2xl transition-all duration-200
                    flex items-center justify-center gap-2 w-[170px] 
                    ${loadSaveChange
                                        ? 'bg-blue-400 dark:bg-blue-800/40 text-white/80 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                                      }
                  `}
                  >
                    {loadSaveChange ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </>
                    ) : (
                      t('save')
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {t('notif_hint')}{' '}
                  <a href="https://ntfy.sh" target="_blank" rel="noreferrer" className="text-blue-500 underline inline-flex items-center gap-0.5 hover:text-blue-700 transition-colors">
                    {t('notif_visit')} <ExternalLink size={10} />
                  </a>
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-1">{t('notif_send_pref')}</label>
                {loadToggle ? (
                  /* تصميم حالة التحميل (Loading State) */
                  <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl border border-transparent opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                      <p className="font-bold text-sm text-gray-400">{t('notif_new_order')}</p>
                    </div>

                    {/* مؤشر التحميل (Spinner) مكان المفتاح */}
                    <div className="w-10 h-6 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </div>
                ) : (
                  /* تصميم الحالة العادية (Active State) */
                  <div
                    onClick={toggleNtfy}
                    className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full bg-emerald-500 transition-opacity ${userData.isNtfy ? 'opacity-100' : 'opacity-30'}`} />
                      <p className={`font-bold text-sm transition-all ${userData.isNtfy ? 'dark:text-white text-gray-800' : 'text-gray-400 line-through'}`}>
                        {t('notif_new_order')}
                      </p>
                    </div>

                    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${userData.isNtfy ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${userData.isNtfy ? (isRtl ? 'right-5' : 'left-5') : (isRtl ? 'right-1' : 'left-1')}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Subscription ─── */}
          {activeTab === 'subscription' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <SectionTitle>{t('tab_subscription')}</SectionTitle>

              {subLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>

              ) : !subscription ? (
                <div className="space-y-5">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{t('sub_no_plan_hint')}</p>
                  {plans.length === 0
                    ? <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-8">{t('sub_no_available_plans')}</p>
                    : (
                      <div className="space-y-3">
                        {plans.map(plan => {
                          const price = getPlanPrice(plan, 'month');
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
                                      : <><span className="font-bold text-gray-700 dark:text-zinc-300">{price.toLocaleString()} {plan.currency}</span> / {t('sub_monthly')}</>
                                    }
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSubscribe(plan.id, 'month')}
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
                  {/* Plan name + status */}
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

                  {/* Price */}
                  <div className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{t('sub_price')}</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {isFree(subscription.plan)
                          ? <span className="text-emerald-500">{t('free')}</span>
                          : <>
                            {getPlanPrice(subscription.plan, subscription.interval).toLocaleString()}
                            <span className="text-sm font-medium text-gray-400 dark:text-zinc-500 ms-1">
                              {subscription.plan.currency} / {subscription.interval === 'year' ? t('sub_annual_short') : t('sub_monthly_short')}
                            </span>
                          </>
                        }
                      </p>
                      {isFree(subscription.plan) && upgradeablePlans.length > 0 && (
                        <button
                          onClick={() => setShowSubModal(true)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 shrink-0"
                        >
                          <Zap size={13} /> {t('sub_upgrade')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: t('sub_start_date'), value: formatDate(subscription.startDate) },
                      { label: t('sub_end_date'), value: formatDate(subscription.endDate) },
                    ].map(item => (
                      <div key={item.label} className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <CalendarDays size={11} /> {item.label}
                        </p>
                        <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Days left progress */}
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

                  {/* Features — من FeaturesEntity */}
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

                  {/* Auto-renew */}
                  {!isFree(subscription.plan) && (
                    <div
                      onClick={handleAutoRenew}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer"
                    >
                      <div>
                        <p className="font-black text-sm text-gray-800 dark:text-white">{t('sub_auto_renew')}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                          {subscription.autoRenew ? t('sub_auto_renew_on') : t('sub_auto_renew_off')}
                        </p>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${subscription.autoRenew ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${subscription.autoRenew ? (isRtl ? 'right-6' : 'left-6') : (isRtl ? 'right-1' : 'left-1')}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {subToast && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold mt-2 ${subToast.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-500'
                  }`}>
                  {subToast.type === 'success' ? <CheckCircle2 size={15} /> : <span>✕</span>}
                  {subToast.msg}
                </div>
              )}
            </div>
          )}

          {/* ── Upgrade Modal ── */}
          {showSubModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={e => { if (e.target === e.currentTarget) setShowSubModal(false); }}
            >
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Zap size={15} className="text-indigo-500" />
                    </div>
                    <h2 className="font-black text-gray-900 dark:text-white text-base">{t('sub_upgrade')}</h2>
                  </div>
                  <button
                    onClick={() => setShowSubModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-lg font-bold"
                  >✕</button>
                </div>

                <p className="px-6 pb-2 text-xs text-gray-400 dark:text-zinc-500">
                  {t('sub_current_label')}: <span className="font-bold text-gray-600 dark:text-zinc-300">{subscription?.plan?.name}</span>
                </p>

                {/* Interval toggle inside modal */}
                <div className="px-6 pb-4">
                  <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
                    {['month', 'year'].map(iv => (
                      <button
                        key={iv}
                        onClick={() => setSubInterval(iv)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${subInterval === iv ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                      >
                        {iv === 'month' ? t('sub_monthly') : t('sub_annual')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-3">
                  {upgradeablePlans.map(plan => {
                    const price = getPlanPrice(plan, subInterval);
                    const savings = plan.monthlyPrice > 0
                      ? Math.round((1 - Number(plan.yearlyPrice) / (Number(plan.monthlyPrice) * 12)) * 100)
                      : 0;
                    const featureRows = buildFeatureSummary(plan.features, t);

                    return (
                      <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                        <div>
                          <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            <span className="font-bold text-gray-700 dark:text-zinc-300">{price.toLocaleString()} {plan.currency}</span>
                            {' / '}{subInterval === 'month' ? t('sub_monthly') : t('sub_annual')}
                          </p>
                          {subInterval === 'year' && savings > 0 && (
                            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{t('save_pct', { pct: savings })}</p>
                          )}
                          {featureRows.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {featureRows.slice(0, 3).map(({ icon: Icon, text }) => (
                                <span key={text} className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg font-semibold inline-flex items-center gap-1">
                                  <Icon size={9} /> {text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleSubscribe(plan.id, subInterval)}
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
        </div>
      </div>
    </div>
  );
};

export default Settings;