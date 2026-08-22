import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';

export default function NotificationsTab({ userData, setUserData }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const isRtl = i18n.dir() === 'rtl';
  const token = getAccessToken();

  const [loadSaveChange, setLoadSaveChange] = useState(false);
  const [loadToggle, setLoadToggle] = useState(false);

  const handleSave = async () => {
    setLoadSaveChange(true);
    try {
      await axios.patch(`${baseURL}/user`, { topic: userData.topic }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { console.error('Save error:', error); }
    finally { setLoadSaveChange(false); }
  };

  const toggleNtfy = async () => {
    setLoadToggle(true);
    try {
      const res = await axios.post(`${baseURL}/user/toggle-ntfy`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUserData({ ...userData, isNtfy: res.data });
    } catch (error) { confirm(error.response?.data.message); }
    finally { setLoadToggle(false); }
  };

  return (
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
            className={`relative px-8 py-3 text-sm font-black rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 w-[170px] ${loadSaveChange ? 'bg-blue-400 dark:bg-blue-800/40 text-white/80 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`}
          >
            {loadSaveChange ? <Loader2 className="animate-spin h-4 w-4 text-white" /> : t('save')}
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
          <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/10 rounded-2xl border border-transparent opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
              <p className="font-bold text-sm text-gray-400">{t('notif_new_order')}</p>
            </div>
            <div className="w-10 h-6 flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
            </div>
          </div>
        ) : (
          <div onClick={toggleNtfy} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/30 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-emerald-500 transition-opacity ${userData.isNtfy ? 'opacity-100' : 'opacity-30'}`} />
              <p className={`font-bold text-sm transition-all ${userData.isNtfy ? 'dark:text-white text-gray-800' : 'text-gray-400 line-through'}`}>{t('notif_new_order')}</p>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${userData.isNtfy ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${userData.isNtfy ? (isRtl ? 'right-5' : 'left-5') : (isRtl ? 'right-1' : 'left-1')}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
