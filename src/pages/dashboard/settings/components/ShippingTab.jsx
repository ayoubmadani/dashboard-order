import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, Plus, Plug, Loader2, ShieldX } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../../constents/const.';
import { getAccessToken } from '../../../../services/access-token';
import AddAccountModal from './AddAccountModal';
import AccountCard from './AccountCard';

export default function ShippingTab() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'settings' });
  const isRtl = i18n.dir() === 'rtl';
  const token = getAccessToken();
  const headers = { headers: { Authorization: `Bearer ${token}` } };
  const storeId = localStorage.getItem('storeId');

  const [shippingAccounts, setShippingAccounts] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const loadShippingAccounts = useCallback(async () => {
    if (!storeId) return;
    setShippingLoading(true);
    try {
      const { data } = await axios.get(`${baseURL}/stores/${storeId}/shipping/accounts`, headers);
      setShippingAccounts(data);
    } catch { setShippingAccounts([]); }
    finally { setShippingLoading(false); }
  }, [storeId, token]);

  useEffect(() => { loadShippingAccounts(); }, [loadShippingAccounts]);

  const handleSetDefaultAccount = async (accountId) => {
    try {
      await axios.patch(`${baseURL}/stores/${storeId}/shipping/accounts/${accountId}/default`, {}, headers);
      loadShippingAccounts();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm(t('shipping_delete_confirm'))) return;
    try {
      await axios.delete(`${baseURL}/stores/${storeId}/shipping/accounts/${accountId}`, headers);
      loadShippingAccounts();
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {showAddAccount && storeId && (
        <AddAccountModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          onClose={() => setShowAddAccount(false)}
          onSaved={loadShippingAccounts}
          t={t}
        />
      )}

      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-black dark:text-white flex items-center gap-2">
              <Truck size={16} className="text-indigo-500" /> {t('shipping_accounts_title')}
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('shipping_accounts_subtitle')}</p>
          </div>
          {storeId && (
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus size={15} /> {t('shipping_add_account')}
            </button>
          )}
        </div>

        {!storeId ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <ShieldX className="w-7 h-7 text-amber-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{t('shipping_no_store_message')}</p>
          </div>
        ) : shippingLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : shippingAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Plug className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-white">{t('shipping_empty_title')}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{t('shipping_empty_subtitle')}</p>
            </div>
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus size={15} /> {t('shipping_add_first_account')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {shippingAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                isRtl={isRtl}
                onSetDefault={handleSetDefaultAccount}
                onDelete={handleDeleteAccount}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
