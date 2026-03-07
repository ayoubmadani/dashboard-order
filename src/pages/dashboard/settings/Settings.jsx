import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon, User, Bell,
  Globe, Save, Moon, Sun, Loader2, ExternalLink
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
    { id: 'profile',       label: t('tab_profile'),       icon: <User size={18} /> },
    { id: 'store',         label: t('tab_preferences'),   icon: <Globe size={18} /> },
    { id: 'notifications', label: t('tab_notifications'), icon: <Bell size={18} /> },
  ];

  /* ── Input class helper ── */
  const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:border-indigo-400 transition-all dark:text-white';
  const disabledInputCls = 'w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed text-sm';

  /* ── Section title ── */
  const SectionTitle = ({ children }) => (
    <h3 className="text-base font-black dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 mb-6">
      {children}
    </h3>
  );

  return (
    <div
      className="max-w-5xl mx-auto space-y-8 pb-10 font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
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
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
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
                  <input
                    type="text"
                    disabled
                    value={userData.username}
                    className={disabledInputCls}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userData.email}
                    className={disabledInputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── Preferences ─── */}
          {activeTab === 'store' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <SectionTitle>{t('platform_pref')}</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Language */}
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

                {/* Dark mode */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Moon size={14} />{t('mode')}
                  </label>
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl font-bold transition-all hover:border-gray-300 dark:hover:border-zinc-600"
                  >
                    <span className="text-sm dark:text-zinc-300">
                      {isDark ? t('dark') : t('light')}
                    </span>
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
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                <h3 className="text-base font-black dark:text-white">{t('notif_title')}</h3>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded-full tracking-wider">
                  Ntfy.sh
                </span>
              </div>

              {/* Topic input */}
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
                  {t('notif_hint')}
                  {' '}
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

              {/* Send preferences */}
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

                  {/* Toggle */}
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

          {/* ── Save button ── */}
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
        </div>
      </div>
    </div>
  );
};

export default Settings;