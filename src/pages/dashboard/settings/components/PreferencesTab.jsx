import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun } from 'lucide-react';
import SectionTitle from './SectionTitle';

const inputCls = 'w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:border-indigo-400 transition-all dark:text-white';

export default function PreferencesTab() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
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
  );
}
