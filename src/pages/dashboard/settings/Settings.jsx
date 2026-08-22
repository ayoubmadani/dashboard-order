import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, User, Store, Bell, Globe, Truck, CreditCard } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import SidebarNav from './components/SidebarNav';
import ProfileTab from './components/ProfileTab';
import StoresTab from './components/StoresTab';
import PreferencesTab from './components/PreferencesTab';
import NotificationsTab from './components/NotificationsTab';
import ShippingTab from './components/ShippingTab';
import SubscriptionTab from './components/SubscriptionTab';

const TAB_IDS = ['profile', 'stores', 'store', 'notifications', 'shipping', 'subscription'];

const Settings = () => {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const { tab } = useParams();
  const activeTab = TAB_IDS.includes(tab) ? tab : 'profile';
  const token = getAccessToken();
  const isRtl = i18n.dir() === 'rtl';

  const { user: contextUser } = useOutletContext();

  const [userData, setUserData] = useState({
    username: contextUser?.name || '',
    email: contextUser?.email || '',
    provider: '',
    topic: '',
    isNtfy: true,
  });

  useEffect(() => {
    if (contextUser?.name) {
      setUserData(prev => ({ ...prev, username: contextUser.name, email: contextUser.email || prev.email }));
    }
  }, [contextUser]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${baseURL}/user/current-user`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUserData(prev => ({
        ...prev, provider: data.provider || '', topic: data.topic || '', isNtfy: data.isNtfy ?? prev.isNtfy,
      })))
      .catch(console.error);
  }, [token]);

  const tabs = [
    { id: 'profile', label: t('tab_profile'), icon: <User size={18} /> },
    { id: 'stores', label: t('tab_stores'), icon: <Store size={18} /> },
    { id: 'store', label: t('tab_preferences'), icon: <Globe size={18} /> },
    { id: 'notifications', label: t('tab_notifications'), icon: <Bell size={18} /> },
    { id: 'shipping', label: t('tab_shipping'), icon: <Truck size={18} /> },
    { id: 'subscription', label: t('tab_subscription'), icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl">
          <SettingsIcon size={22} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SidebarNav tabs={tabs} activeTab={activeTab} />

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && <ProfileTab userData={userData} setUserData={setUserData} />}
          {activeTab === 'stores' && <StoresTab />}
          {activeTab === 'store' && <PreferencesTab />}
          {activeTab === 'notifications' && <NotificationsTab userData={userData} setUserData={setUserData} />}
          {activeTab === 'shipping' && <ShippingTab />}
          {activeTab === 'subscription' && <SubscriptionTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
