import React from 'react';
import { Star, Trash2, Truck } from 'lucide-react';

export default function AccountCard({ account, onSetDefault, onDelete, isRtl, t }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      account.isDefault
        ? 'bg-indigo-50/60 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/40'
        : 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800'
    }`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        account.isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
      }`}>
        <Truck className={`w-5 h-5 ${account.isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-gray-800 dark:text-white">{account.accountName}</p>
          {account.isDefault && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Star className="w-2.5 h-2.5" /> {t('shipping_default_badge')}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            account.isVerified
              ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600'
              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
          }`}>
            {account.isVerified ? t('shipping_verified') : t('shipping_unverified')}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{account.providerName}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!account.isDefault && (
          <button
            onClick={() => onSetDefault(account.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
          >
            <Star className="w-3 h-3" /> {t('shipping_set_default')}
          </button>
        )}
        <button
          onClick={() => onDelete(account.id)}
          className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
