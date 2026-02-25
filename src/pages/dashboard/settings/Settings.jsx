import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { 
  Settings as SettingsIcon, User, Lock, Bell, 
  Globe, Coins, ShieldCheck, Save, Moon, Sun, Loader2, ExternalLink
} from 'lucide-react';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ 
    username: '', 
    email: '', 
    provider: '' // لتحديد إذا كان المستخدم من Google أم لا
  });
  
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const isRtl = i18n.language === 'ar';

  // 1. جلب بيانات المستخدم عند تحميل الصفحة
  useEffect(() => {
    const fetchUserData = async () => {
      const token = Cookies.get('access_token');
      try {
        const response = await fetch('http://localhost:7000/user/current-user', {
          headers: {
            'Authorization': `bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserData({ 
            username: data.username, 
            email: data.email,
            provider: data.provider // تأكد أن السيرفر يعيد الحقل بهذا الاسم
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchUserData();
  }, []);

  // 2. إدارة الوضع الليلي
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
    { id: 'security', label: t('settings.security', 'الأمان'), icon: <Lock size={18} /> },
    { id: 'notifications', label: t('settings.notifications', 'التنبيهات'), icon: <Bell size={18} /> },
  ];

  const handleSave = async () => {
    setLoading(true);
    // منطق الحفظ (PATCH) يتم إضافته هنا لاحقاً
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg">
              <SettingsIcon size={24} />
            </div>
            {t('dashboard.settings', 'الإعدادات العامة')}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            {t('settings.desc', 'إدارة بياناتك، تفضيلات المظهر، وأمان حسابك.')}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Tabs */}
        <aside className="lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' 
                : 'bg-white dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-lg font-black dark:text-white border-b dark:border-zinc-800 pb-4">
                {t('settings.personal_info', 'المعلومات الشخصية')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold dark:text-zinc-300">{t('settings.username', 'اسم المستخدم')}</label>
                  <input 
                    type="text" 
                    value={userData.username}
                    onChange={(e) => setUserData({...userData, username: e.target.value})}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl outline-none dark:text-white focus:ring-2 focus:ring-zinc-500/10 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold dark:text-zinc-300">{t('settings.email', 'البريد الإلكتروني')}</label>
                  <input 
                    type="email" 
                    value={userData.email}
                    disabled 
                    className="w-full px-5 py-3 bg-gray-100 dark:bg-zinc-800/30 border dark:border-zinc-800 rounded-2xl text-gray-400 cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>
          )}

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

          {/* 3. Security Tab (منطقي لإخفاء كلمة المرور لمستخدمي جوجل) */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-lg font-black dark:text-white border-b dark:border-zinc-800 pb-4 flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" /> {t('settings.security', 'أمان الحساب')}
              </h3>
              
              {userData.provider === 'GOOGLE' ? (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-bold text-gray-600 dark:text-zinc-400 leading-relaxed">
                    {t('settings.google_msg', 'حسابك مرتبط بـ Google. يتم إدارة كلمة المرور وإعدادات الأمان ثنائية العامل عبر حساب Google الخاص بك.')}
                  </p>
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 underline">
                    {t('settings.manage_google', 'إدارة حساب Google')} <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold dark:text-zinc-300">{t('settings.curr_pass', 'كلمة المرور الحالية')}</label>
                    <input type="password" placeholder="••••••••" className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold dark:text-zinc-300">{t('settings.new_pass', 'كلمة المرور الجديدة')}</label>
                    <input type="password" placeholder="••••••••" className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-lg font-black dark:text-white border-b dark:border-zinc-800 pb-4">{t('settings.notif', 'التنبيهات')}</h3>
              <div className="space-y-4">
                {['orders', 'stock'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-800">
                    <p className="font-bold dark:text-white text-sm">{item === 'orders' ? 'طلبات جديدة' : 'تحديثات المخزون'}</p>
                    <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 ${isRtl ? 'right-1' : 'left-5'}`}></div>
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