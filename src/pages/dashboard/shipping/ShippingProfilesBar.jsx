import React, { useState } from 'react';
import { Layers, Plus, Pencil, Trash2, Check, Loader2, Store, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';

// شريط «حسابات الشحن»: لكل حساب أسعاره وولاياته، والتاجر يختار الحساب الذي يستعمله كل متجر.
// الجدول أسفل الصفحة يعرض/يعدّل أسعار الحساب المختار هنا.
export default function ShippingProfilesBar({ profiles, selectedId, onSelect, onChanged, storeId, headers, isRtl, showToast }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping.profiles' });
  const [modal, setModal] = useState(null); // { mode: 'create' | 'rename', name }
  const [busy, setBusy] = useState(false);

  const selected = profiles.find((p) => p.id === selectedId) || profiles[0];
  const storeProfile = profiles.find((p) => p.stores.some((s) => s.id === storeId));
  const usedByCurrentStore = storeProfile?.id === selected?.id;

  const submitModal = async () => {
    const name = modal?.name?.trim();
    if (!name) return;
    setBusy(true);
    try {
      if (modal.mode === 'create') {
        const { data } = await axios.post(`${baseURL}/shipping/profiles`, { name, copyFromId: selected?.id }, headers);
        await onChanged(data.id);
        showToast('success', t('created'));
      } else {
        await axios.patch(`${baseURL}/shipping/profiles/${selected.id}`, { name }, headers);
        await onChanged(selected.id);
        showToast('success', t('renamed'));
      }
      setModal(null);
    } catch { showToast('error', t('error')); }
    finally { setBusy(false); }
  };

  const removeProfile = async () => {
    if (!selected || selected.isDefault) return;
    if (!window.confirm(t('delete_confirm', { name: selected.name }))) return;
    setBusy(true);
    try {
      await axios.delete(`${baseURL}/shipping/profiles/${selected.id}`, headers);
      await onChanged(null);
      showToast('success', t('deleted'));
    } catch { showToast('error', t('error')); }
    finally { setBusy(false); }
  };

  const useForStore = async () => {
    if (!storeId || !selected) return;
    setBusy(true);
    try {
      await axios.post(`${baseURL}/shipping/store-profile`, { storeId, profileId: selected.id }, headers);
      await onChanged(selected.id);
      showToast('success', t('assigned', { name: selected.name }));
    } catch { showToast('error', t('error')); }
    finally { setBusy(false); }
  };

  if (!selected) return null;

  return (
    <div className="mb-5 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{t('title')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${p.id === selected.id
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:border-indigo-300'}`}
            >
              {p.name}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${p.id === selected.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-zinc-700'}`}>
                {t('wilayas_count', { count: p.activeWilayas })}
              </span>
            </button>
          ))}
          <button
            onClick={() => setModal({ mode: 'create', name: '' })}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> {t('new')}
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {selected.stores.length
              ? t('used_by', { stores: selected.stores.map((s) => s.name).join('، ') })
              : t('used_by_none')}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {storeId && (usedByCurrentStore ? (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" /> {t('current_store_uses')}
            </span>
          ) : (
            <button onClick={useForStore} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-60">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Store className="w-3.5 h-3.5" />} {t('use_for_store')}
            </button>
          ))}
          <button onClick={() => setModal({ mode: 'rename', name: selected.name })} title={t('rename')}
            className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {!selected.isDefault && (
            <button onClick={removeProfile} disabled={busy} title={t('delete')}
              className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-60">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !busy && setModal(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{modal.mode === 'create' ? t('new_title') : t('rename_title')}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <input
              autoFocus
              value={modal.name}
              onChange={(e) => setModal({ ...modal, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && submitModal()}
              placeholder={t('name_placeholder')}
              maxLength={80}
              className="w-full border rounded-xl py-2.5 px-3 text-sm outline-none bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            {modal.mode === 'create' && (
              <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">{t('copy_hint', { name: selected.name })}</p>
            )}
            <button onClick={submitModal} disabled={busy || !modal.name.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
