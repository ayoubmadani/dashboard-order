import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon, User, Bell,
  Globe, Save, Moon, Sun, Loader2, ExternalLink,
  CreditCard, CheckCircle2, CalendarDays, Zap, ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const Settings = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading]     = useState(false);
  const token = getAccessToken();

  const [userData, setUserData] = useState({
    username: '',
    email: '',
    provider: '',
    topic: '',
    isNtfy: true,
  });

  const [subscription,  setSubscription]  = useState(null);
  const [subLoading,    setSubLoading]    = useState(false);
  const [plans,         setPlans]         = useState([]);
  const [plansLoading,  setPlansLoading]  = useState(false);
  const [subscribing,   setSubscribing]   = useState(null);   // planId being processed
  const [subToast,      setSubToast]      = useState(null);   // { msg, type }
  const [showUpgrade,   setShowUpgrade]   = useState(false);  // toggle upgrade panel
  const [showSubModal,  setShowSubModal]  = useState(false);  // upgrade modal

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const isRtl = i18n.dir() === 'rtl';

  /* ── Fetch user ── */
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get(`${baseURL}/user/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData({
          username: data.username || '',
          email:    data.email    || '',
          provider: data.provider || '',
          topic:    data.topic    || '',
          isNtfy:   data.isNtfy,
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    if (token) fetchUserData();
  }, [token]);

  /* ── Fetch subscription — if none, auto-subscribe to the free plan ── */
  useEffect(() => {
    if (activeTab !== 'subscription' || subscription !== null) return;
    const fetchSub = async () => {
      setSubLoading(true);
      try {
        const { data } = await axios.get(`${baseURL}/subscription/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data) {
          setSubscription(data);
        } else {
          const { data: allPlans } = await axios.get(`${baseURL}/plans?active=true`);
          setPlans(allPlans);
          const freePlan = allPlans.find(p => Number(p.price) === 0);
          if (freePlan) {
            await axios.post(
              `${baseURL}/subscription/subscribe`,
              { planId: freePlan.id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const { data: newSub } = await axios.get(`${baseURL}/subscription/my`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setSubscription(newSub);
          } else {
            setSubscription(null);
          }
        }
      } catch {
        setSubscription(null);
      } finally {
        setSubLoading(false);
      }
    };
    fetchSub();
  }, [activeTab, token, subscription]);

  /* ── Fetch plans for upgrade panel (lazy, once) ── */
  useEffect(() => {
    if (activeTab !== 'subscription' || plans.length > 0) return;
    axios
      .get(`${baseURL}/plans?active=true`)
      .then(r => setPlans(r.data))
      .catch(() => {});
  }, [activeTab, plans.length]);

  /* ── Subscribe to a plan ── */
  const handleSubscribe = async (planId) => {
    setSubscribing(planId);
    try {
      await axios.post(
        `${baseURL}/subscription/subscribe`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // re-fetch active subscription
      const { data } = await axios.get(`${baseURL}/subscription/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(data);
      setShowUpgrade(false);
      setShowSubModal(false);
      showSubToast(t('sub_success'), 'success');
    } catch (err) {
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // rollback on failure
      setSubscription(prev => ({ ...prev, autoRenew: !next }));
      showSubToast(t('sub_error'), 'error');
    }
  };

  /* ── Dark mode ── */
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  /* ── Save ── */
  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch(
        `${baseURL}/user`,
        { topic: userData.topic, isNtfy: userData.isNtfy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile',       label: t('tab_profile'),       icon: <User       size={18} /> },
    { id: 'store',         label: t('tab_preferences'),   icon: <Globe      size={18} /> },
    { id: 'notifications', label: t('tab_notifications'), icon: <Bell       size={18} /> },
    { id: 'subscription',  label: t('tab_subscription'),  icon: <CreditCard size={18} /> },
  ];

  const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:border-indigo-400 transition-all dark:text-white';
  const disabledInputCls = 'w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed text-sm';

  const SectionTitle = ({ children }) => (
    <h3 className="text-base font-black dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6">
      {children}
    </h3>
  );

  /* ── Subscription tab helpers ── */
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const daysLeft = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const showSaveButton = activeTab !== 'subscription';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl">
          <SettingsIcon size={22} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {t('title')}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Sidebar tabs ── */}
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
                  : 'bg-white dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* ── Tab panels ── */}
        <div className="flex-1 space-y-6">

          {/* ─── Profile ─── */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <SectionTitle>{t('personal_info')}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('username')}
                  </label>
                  <input type="text" disabled value={userData.username} className={disabledInputCls} />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('email')}
                  </label>
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
                  <select
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                  >
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
                    {isDark
                      ? <Moon size={18} className="text-yellow-400" />
                      : <Sun  size={18} className="text-orange-500" />}
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
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded-full tracking-wider">
                  Ntfy.sh
                </span>
              </div>
              <div className="space-y-3 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <label className="flex items-center gap-2 text-sm font-bold dark:text-zinc-300">
                  <Bell size={15} className="dark:text-white" />
                  {t('notif_topic_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('notif_topic_placeholder')}
                  value={userData.topic}
                  onChange={(e) => setUserData({ ...userData, topic: e.target.value })}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl outline-none focus:border-indigo-400 dark:text-white font-mono text-sm transition-all"
                  dir="ltr"
                />
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {t('notif_hint')}{' '}
                  <a
                    href="https://ntfy.sh"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline inline-flex items-center gap-0.5 hover:text-blue-700 transition-colors"
                  >
                    {t('notif_visit')} <ExternalLink size={10} />
                  </a>
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                  {t('notif_send_pref')}
                </label>
                <div
                  onClick={() => setUserData({ ...userData, isNtfy: !userData.isNtfy })}
                  className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-emerald-500 transition-opacity ${userData.isNtfy ? 'opacity-100' : 'opacity-30'}`} />
                    <p className={`font-bold text-sm ${userData.isNtfy ? 'dark:text-white text-gray-800' : 'text-gray-400 line-through'}`}>
                      {t('notif_new_order')}
                    </p>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${userData.isNtfy ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300
                        ${userData.isNtfy
                          ? (isRtl ? 'right-5' : 'left-5')
                          : (isRtl ? 'right-1' : 'left-1')
                        }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Subscription ─── */}
          {activeTab === 'subscription' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <SectionTitle>{t('tab_subscription')}</SectionTitle>

              {subLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>

              ) : !subscription ? (
                /* ── No active plan — show available plans ── */
                <div className="space-y-5">
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{t('sub_no_plan_hint')}</p>

                  {plansLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 size={22} className="animate-spin text-gray-400" />
                    </div>
                  ) : plans.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-8">
                      {t('sub_no_available_plans')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {plans.map(plan => (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                        >
                          {/* Plan info */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                              <Zap size={16} className="text-indigo-500" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                                <span className="font-bold text-gray-700 dark:text-zinc-300">
                                  {Number(plan.price).toLocaleString()} {plan.currency}
                                </span>
                                {' / '}
                                {plan.interval === 'month' ? t('sub_monthly') : t('sub_annual')}
                              </p>
                            </div>
                          </div>

                          {/* Subscribe button */}
                          <button
                            onClick={() => handleSubscribe(plan.id)}
                            disabled={!!subscribing}
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                          >
                            {subscribing === plan.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <ChevronRight size={13} />
                            }
                            {t('sub_activate')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              ) : (
                /* ── Active plan ── */
                <div className="space-y-5">

                  {/* Plan name + status badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Zap size={20} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-black text-lg text-gray-900 dark:text-white leading-tight">
                          {subscription.plan.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                          {subscription.plan.interval === 'month' ? t('sub_monthly') : t('sub_annual')}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-full">
                      <CheckCircle2 size={12} /> {t('sub_active')}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                      {t('sub_price')}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-black text-gray-900 dark:text-white">
                        {Number(subscription.plan.price).toLocaleString()}
                        <span className="text-sm font-medium text-gray-400 dark:text-zinc-500 ms-1">
                          {subscription.plan.currency} / {subscription.plan.interval}
                        </span>
                      </p>
                      {Number(subscription.plan.price) === 0 && plans.filter(p => p.id !== subscription.plan.id).length > 0 && (
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
                    <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CalendarDays size={11} /> {t('sub_start_date')}
                      </p>
                      <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">
                        {formatDate(subscription.startDate)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CalendarDays size={11} /> {t('sub_end_date')}
                      </p>
                      <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">
                        {formatDate(subscription.endDate)}
                      </p>
                    </div>
                  </div>

                  {/* Days remaining progress bar */}
                  {(() => {
                    const total = new Date(subscription.endDate) - new Date(subscription.startDate);
                    const elapsed = new Date() - new Date(subscription.startDate);
                    const pct = Math.min(100, Math.round((elapsed / total) * 100));
                    const left = daysLeft(subscription.endDate);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-zinc-500">
                          <span>{t('sub_days_left')}</span>
                          <span className={left <= 7 ? 'text-red-400' : 'text-emerald-500'}>
                            {left} {t('sub_days')}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Features */}
                  {subscription.plan.features?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                        {t('sub_features')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subscription.plan.features.map(f => (
                          <span
                            key={f}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl"
                          >
                            <CheckCircle2 size={11} /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-renew toggle — only for paid plans */}
                  {Number(subscription.plan.price) > 0 && (
                    <div
                      onClick={handleAutoRenew}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer"
                    >
                      <div>
                        <p className="font-black text-sm text-gray-800 dark:text-white">
                          {t('sub_auto_renew')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                          {subscription.autoRenew ? t('sub_auto_renew_on') : t('sub_auto_renew_off')}
                        </p>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${subscription.autoRenew ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${
                          subscription.autoRenew
                            ? (isRtl ? 'right-6' : 'left-6')
                            : (isRtl ? 'right-1' : 'left-1')
                        }`} />
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Sub toast */}
              {subToast && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold mt-2 ${
                  subToast.type === 'success'
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

                {/* Modal header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                      <Zap size={15} className="text-indigo-500" />
                    </div>
                    <h2 className="font-black text-gray-900 dark:text-white text-base">
                      {t('sub_upgrade')}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSubModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Current plan label */}
                <p className="px-6 pb-4 text-xs text-gray-400 dark:text-zinc-500">
                  {t('sub_current_label')}:{' '}
                  <span className="font-bold text-gray-600 dark:text-zinc-300">
                    {subscription?.plan?.name}
                  </span>
                </p>

                {/* Plans list */}
                <div className="px-6 pb-6 space-y-3">
                  {plans
                    .filter(p => p.id !== subscription?.plan?.id)
                    .map(plan => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                      >
                        <div>
                          <p className="font-black text-sm text-gray-900 dark:text-white">{plan.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            <span className="font-bold text-gray-700 dark:text-zinc-300">
                              {Number(plan.price).toLocaleString()} {plan.currency}
                            </span>
                            {' / '}
                            {plan.interval === 'month' ? t('sub_monthly') : t('sub_annual')}
                          </p>
                          {plan.features?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {plan.features.slice(0, 3).map(f => (
                                <span key={f} className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg font-semibold">
                                  {f}
                                </span>
                              ))}
                              {plan.features.length > 3 && (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 text-gray-400 rounded-lg font-semibold">
                                  +{plan.features.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={!!subscribing}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl active:scale-95 disabled:opacity-50 transition-all shrink-0 ms-3"
                        >
                          {subscribing === plan.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Zap size={13} />
                          }
                          {t('sub_activate')}
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── Save button (hidden on subscription tab) ── */}
          {showSaveButton && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {t('save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;