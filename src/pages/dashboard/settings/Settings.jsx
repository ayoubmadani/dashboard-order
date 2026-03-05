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
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const token = getAccessToken();

  const [userData, setUserData] = useState({
    username: '',
    email: '',
    provider: '',
    topic: '',
    isNtfy: true
  });

  const [notifications, setNotifications] = useState({
    orders: true,
  });

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const isRtl = i18n.language === 'ar';

  // 1. جلب البيانات باستخدام axios
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${baseURL}/user/current-user`, {
          headers: { 'Authorization': `Bearer ${token}` } // تم تصحيح البنية هنا
        });

        // في axios البيانات تكون داخل response.data مباشرة
        const data = response.data;
        console.log(data);
        
        setUserData({
          username: data.username || '',
          email: data.email || '',
          provider: data.provider || '',
          topic: data.topic || '',
          isNtfy:data.isNtfy
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    if (token) fetchUserData();
  }, [token]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const tabs = [
    { id: 'profile', label: t('settings.profile', 'الحساب الشخصي'), icon: <User size={18} /> },
    { id: 'store', label: t('settings.preferences', 'التفضيلات'), icon: <Globe size={18} /> },
    { id: 'notifications', label: t('settings.notifications', 'التنبيهات'), icon: <Bell size={18} /> },
  ];

  // 2. دالة الحفظ مع تصحيح منطق axios
  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.patch(`${baseURL}/user`,
        { topic: userData.topic, isNtfy: userData.isNtfy },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 204) {
        // هنا يمكنك إضافة Toast للنجاح
        console.log("تم الحفظ بنجاح!");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg">
              <SettingsIcon size={24} />
            </div>
            {t('dashboard.settings', 'الإعدادات العامة')}
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
                : 'bg-white dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* 2. Preferences Tab */}
          {activeTab === 'store' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              <section className="space-y-6">
                <h3 className="text-lg font-black dark:text-white border-b dark:border-zinc-800 pb-4">{t('settings.platform_pref', 'تفضيلات المنصة')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold dark:text-zinc-300 flex items-center gap-2"><Globe size={16} /> {t('settings.language', 'اللغة')}</label>
                    <select 
                      value={i18n.language}
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                      className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl font-bold dark:text-white outline-none"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                      <option value="fr">farnce</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold dark:text-zinc-300 flex items-center gap-2"><Moon size={16} /> {t('settings.mode', 'المظهر')}</label>
                    <button 
                      onClick={() => setIsDark(!isDark)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl font-bold"
                    >
                      <span className="dark:text-zinc-300">{isDark ? t('settings.dark', 'داكن') : t('settings.light', 'فاتح')}</span>
                      {isDark ? <Moon size={18} className="text-yellow-400" /> : <Sun size={18} className="text-orange-500" />}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-lg font-black dark:text-white border-b dark:border-zinc-800 pb-4">
                {t('settings.personal_info', 'المعلومات الشخصية')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold dark:text-zinc-300">{t('settings.username')}</label>
                  <input
                    type="text"
                    disabled
                    value={userData.username}
                    className="w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold dark:text-zinc-300">{t('settings.email')}</label>
                  <input
                    type="email"
                    disabled
                    value={userData.email}
                    className="w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-4">
                <h3 className="text-lg font-black dark:text-white">{t('settings.notif', 'التنبيهات')}</h3>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-bold rounded-full">Ntfy.sh</span>
              </div>

              <div className="space-y-3 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={16} className="dark:text-white" />
                  <label className="text-sm font-bold dark:text-zinc-300">موضوع تنبيهات Ntfy</label>
                </div>
                <input
                  type="text"
                  placeholder="my_store_alerts_123"
                  value={userData.topic}
                  onChange={(e) => setUserData({ ...userData, topic: e.target.value })}
                  className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl outline-none dark:text-white font-mono text-sm"
                />
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  أدخل هذا الرمز في تطبيق <b>Ntfy</b> على هاتفك لاستلام الإشعارات.
                  <a href="https://ntfy.sh" target="_blank" rel="noreferrer" className="text-blue-500 underline ml-1 inline-flex items-center gap-0.5">
                    زيارة Ntfy <ExternalLink size={10} />
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest px-2">تفضيلات الإرسال</label>

                {[
                  { id: 'orders', label: 'تنبيه عند استلام طلب جديد', color: 'bg-emerald-500' }
                ].map((pref) => (
                  <div
                    key={pref.id}
                    // تحديث الحالة داخل userData مباشرة
                    onClick={() => setUserData({ ...userData, isNtfy: !userData.isNtfy })}
                    className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* التغيير هنا: الاعتماد على userData.isNtfy */}
                      <div className={`w-2 h-2 rounded-full ${pref.color} ${userData.isNtfy ? 'opacity-100' : 'opacity-30'}`} />
                      <p className={`font-bold text-sm ${userData.isNtfy ? 'dark:text-white' : 'text-gray-400 line-through'}`}>
                        {pref.label}
                      </p>
                    </div>

                    {/* مفتاح التبديل (Toggle) يعتمد الآن على userData.isNtfy */}
                    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${userData.isNtfy ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 
                            ${userData.isNtfy
                          ? (isRtl ? 'right-5' : 'left-5')
                          : (isRtl ? 'right-1' : 'left-1')
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="group flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('common.save', 'حفظ التغييرات')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;