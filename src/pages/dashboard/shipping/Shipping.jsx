import React, { useState, useEffect } from 'react';
import {
  Save, ArrowLeft, Search,
  Home, Building2, RefreshCcw,
  Filter, Plus, Sparkles, Loader2,
  CheckCircle2, XCircle, RotateCcw,
  Truck, Star, ShieldX, Settings2,
  Pencil, Eye, EyeOff, Shield, ShieldCheck, X,
  Download, Copy, Trash2, AlertCircle, MapPin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../../services/access-token';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';

function useAuthHeaders() {
  const token = getAccessToken();
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─────────────────────────────────────────────
//  Sub-component: price input cell
// ─────────────────────────────────────────────
function PriceCell({ value, onChange, focusRing, disabled }) {
  return (
    <div className="relative flex items-center" dir="ltr">
      <input
        type="number"
        min="0"
        dir="ltr"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full border rounded-xl py-2 pl-3 pr-10 text-sm font-bold outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 ${
          disabled
            ? 'bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
            : `bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 ${focusRing}`
        }`}
      />
      <span className="absolute right-3 text-xs font-semibold text-gray-400 dark:text-zinc-500 pointer-events-none select-none">DA</span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: status checkbox
// ─────────────────────────────────────────────
function StatusToggle({ isActive, onToggle, loading }) {
  return (
    <label className={`relative flex items-center justify-center cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
      <input type="checkbox" checked={!!isActive} onChange={onToggle} className="sr-only peer" />
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}`}>
        {isActive && !loading && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {loading && <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />}
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: empty state
// ─────────────────────────────────────────────
function EmptyState({ onInitialize, isLoading }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-indigo-400 dark:text-indigo-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-black">!</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-gray-800 dark:text-white">{t('empty.title')}</p>
            <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-xs">{t('empty.subtitle')}</p>
          </div>
          <button
            onClick={onInitialize}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isLoading ? t('empty.initializing') : t('empty.init_btn')}
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: wilaya row
// ─────────────────────────────────────────────
function WilayaRow({ wilaya, onPriceChange, onToggle, onSave, onDelete, toggleLoading, saveLoading, isSelected, onToggleSelect }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  const isSaving   = saveLoading  === wilaya.id;
  const isToggling = toggleLoading === wilaya.id;
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await onSave(wilaya);
    setIsEditing(false);
  };

  return (
    <tr className="group border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(wilaya.id)}
          className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black shrink-0">
            {wilaya.code ?? wilaya.id}
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">{wilaya.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 w-36">
        <PriceCell value={wilaya.livraisonHome} onChange={(v) => onPriceChange(wilaya.id, 'livraisonHome', v)} focusRing="focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" disabled={!isEditing} />
      </td>
      <td className="px-4 py-3 w-36">
        <PriceCell value={wilaya.livraisonOfice} onChange={(v) => onPriceChange(wilaya.id, 'livraisonOfice', v)} focusRing="focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" disabled={!isEditing} />
      </td>
      <td className="px-4 py-3 w-36">
        <PriceCell value={wilaya.livraisonReturn} onChange={(v) => onPriceChange(wilaya.id, 'livraisonReturn', v)} focusRing="focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10" disabled={!isEditing} />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusToggle isActive={wilaya.isActive} onToggle={() => onToggle(wilaya.id)} loading={isToggling} />
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t('save_row')}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              title={t('edit_row')}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 transition-all active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(wilaya)}
            title={t('delete_row')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: delete confirmation modal (single wilaya or a selected group)
// ─────────────────────────────────────────────
function DeleteConfirmModal({ names, isRtl, isDeleting, onConfirm, onClose }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white">{t('delete_confirm_title')}</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {names.length === 1
              ? t('delete_confirm_single', { name: names[0] })
              : t('delete_confirm_bulk', { count: names.length })}
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          >
            {t('delete_cancel_btn')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('delete_confirm_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: add-missing-wilayas modal
//  يجلب قائمة كل الولايات، يحسب الناقصة منها محلياً، ويترك الأدمن يختار أيها يضيف
// ─────────────────────────────────────────────
function AddMissingWilayasModal({ headers, isRtl, existingIds, onClose, onAdded }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  const [isLoading, setIsLoading] = useState(true);
  const [missing, setMissing] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${baseURL}/shipping/wilayas`)
      .then(({ data }) => {
        const missingWilayas = (data || []).filter(w => !existingIds.has(w.id));
        setMissing(missingWilayas);
        setSelectedIds(new Set(missingWilayas.map(w => w.id)));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filteredMissing = missing.filter(
    w => w.name.includes(searchQuery) || (w.ar_name ?? '').includes(searchQuery) || String(w.id).includes(searchQuery)
  );

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev => {
      const allSelected = filteredMissing.length > 0 && filteredMissing.every(w => prev.has(w.id));
      return allSelected ? new Set() : new Set(filteredMissing.map(w => w.id));
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await axios.post(
        `${baseURL}/shipping/add-missing-shipping`,
        { wilayaIds: Array.from(selectedIds) },
        headers,
      );
      onAdded(data.wilayas, data.added);
      onClose();
    } catch (e) {
      console.error(e);
      setError(t('missingModal.submit_error'));
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">{t('missingModal.title')}</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('missingModal.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-xs font-semibold">
            <ShieldX className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
        ) : missing.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-white">{t('missingModal.none_title')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('missingModal.none_hint')}</p>
          </div>
        ) : (
          <>
            {/* Search + select all */}
            <div className="px-5 pt-4 flex flex-col gap-3">
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl py-2.5 ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 dark:focus:border-indigo-600 dark:text-white text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-600 transition-all`}
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filteredMissing.length > 0 && filteredMissing.every(w => selectedIds.has(w.id))}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                {t('missingModal.select_all')}
              </label>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
              {filteredMissing.map(wilaya => (
                <label
                  key={wilaya.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-all cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(wilaya.id)}
                    onChange={() => toggleOne(wilaya.id)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black shrink-0">
                    {wilaya.id}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">{wilaya.name}</span>
                </label>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={handleSubmit}
                disabled={selectedIds.size === 0 || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t('missingModal.add_btn', { count: selectedIds.size })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: Account Selector Modal
//  يختار الحساب النشط من الحسابات المُعدَّة في الإعدادات
// ─────────────────────────────────────────────
function AccountSelectorModal({ storeId, headers, isRtl, onClose, onSelected }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingId, setSettingId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  const loadAccounts = () => {
    axios.get(`${baseURL}/stores/${storeId}/shipping/accounts`, headers)
      .then(r => setAccounts(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadAccounts(); }, [storeId]);

  const handleSelect = async (accountId) => {
    setSettingId(accountId);
    try {
      await axios.patch(`${baseURL}/stores/${storeId}/shipping/accounts/${accountId}/default`, {}, headers);
      onSelected();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSettingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Truck className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">{t('accounts.selector_title')}</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('accounts.selector_subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors text-lg font-bold">✕</button>
        </div>

        {/* Accounts list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ShieldX className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-white">{t('accounts.none_title')}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('accounts.none_hint')}</p>
              <button
                onClick={() => { onClose(); navigate('/dashboard/settings'); }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                {t('accounts.goto_settings')}
              </button>
            </div>
          ) : (
            accounts.map(account => (
              <div
                key={account.id}
                className={`w-full flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                  account.isDefault
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20'
                    : 'border-gray-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <button
                  onClick={() => handleSelect(account.id)}
                  disabled={!!settingId}
                  className={`flex-1 min-w-0 flex items-center gap-3 text-${isRtl ? 'right' : 'left'} disabled:opacity-60`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${account.isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    <Truck className={`w-4 h-4 ${account.isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{account.accountName}</p>
                      {account.isDefault && <Star className="w-3 h-3 text-indigo-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{account.providerName} · {account.isVerified ? t('accounts.verified_badge') : t('accounts.unverified_badge')}</p>
                  </div>
                </button>
                <button
                  onClick={() => setEditingAccount(account)}
                  title={t('accounts.edit_tooltip')}
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700 transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {settingId === account.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
                ) : account.isDefault ? (
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                ) : null}
              </div>
            ))
          )}
        </div>

        {/* Footer link to settings */}
        {accounts.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={() => { onClose(); navigate('/dashboard/settings'); }}
              className="text-xs text-indigo-500 hover:underline font-semibold flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" /> {t('accounts.manage_link')}
            </button>
          </div>
        )}
      </div>

      {editingAccount && (
        <EditAccountModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSaved={loadAccounts}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: credential input (with show/hide for secrets)
// ─────────────────────────────────────────────
function CredentialField({ label, value, onChange, isPassword }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !visible ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 pr-10 text-sm font-medium text-gray-700 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: Edit account modal (accountName + credentials)
// ─────────────────────────────────────────────
function EditAccountModal({ storeId, headers, isRtl, account, onClose, onSaved }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  const credentialKeys = (() => {
    if (['Yalidine', 'Yalitec'].includes(account.providerName)) return ['id', 'token'];
    if (account.providerName === 'ZRExpress') return ['token', 'key'];
    return ['token'];
  })();

  const parsedCredentials = (() => {
    try { return JSON.parse(account.credentials || '{}'); } catch { return {}; }
  })();

  const [accountName, setAccountName] = useState(account.accountName);
  const [credentials, setCredentials] = useState(parsedCredentials);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState(null);

  const isFilled = accountName.trim() && credentialKeys.every(k => credentials[k]?.trim());

  const handleSave = async () => {
    setIsSaving(true);
    setResult(null);
    try {
      const { data } = await axios.patch(
        `${baseURL}/stores/${storeId}/shipping/accounts/${account.id}`,
        { accountName, credentials },
        headers,
      );
      onSaved();
      setResult(data.isVerified ? 'ok' : 'fail');
    } catch (e) {
      console.error(e);
      setResult('error');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">{t('editAccount.title')}</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{account.providerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">{t('editAccount.account_name_label')}</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-sm font-medium text-gray-700 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> {t('editAccount.credentials_label')}
            </p>
            {credentialKeys.map(key => (
              <CredentialField
                key={key}
                label={key.toUpperCase()}
                value={credentials[key] ?? ''}
                onChange={(v) => { setCredentials(p => ({ ...p, [key]: v })); setResult(null); }}
                isPassword={key === 'token' || key === 'key'}
              />
            ))}
          </div>

          {result && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
              result === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'
            }`}>
              {result === 'ok'
                ? <><ShieldCheck className="w-4 h-4 shrink-0" /> {t('editAccount.result_ok')}</>
                : result === 'fail'
                  ? <><ShieldX className="w-4 h-4 shrink-0" /> {t('editAccount.result_fail')}</>
                  : <><ShieldX className="w-4 h-4 shrink-0" /> {t('editAccount.result_error')}</>
              }
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={!isFilled || isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('editAccount.save_button')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: extract a home/office price from a carrier's raw rate object
//  كل شركة توصيل ترجع تسمية حقول مختلفة، لذا نجرب أكثر الأسماء شيوعاً
// ─────────────────────────────────────────────
function pickPrice(rate, candidates) {
  for (const key of candidates) {
    const raw = rate?.[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const num = Number(raw);
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

function extractHomeOfficePrices(rate) {
  return {
    home: pickPrice(rate, ['tarif_domicile', 'domicile', 'home', 'express_home', 'TarifDomicile', 'tarif', 'Tarif', 'price']),
    office: pickPrice(rate, ['tarif_stopdesk', 'stopdesk', 'desk', 'express_desk', 'TarifStopDesk', 'bureau']),
  };
}

function findRateForWilaya(rates, wilayaId) {
  return rates.find(r => Number(r?.wilaya_id ?? r?.IDWilaya ?? r?.id) === Number(wilayaId));
}

// ─────────────────────────────────────────────
//  Sub-component: Fetch rates modal — اختيار شركة التوصيل لجلب أسعارها
// ─────────────────────────────────────────────
function FetchRatesModal({ storeId, headers, isRtl, onClose, onApplied }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchingId, setFetchingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${baseURL}/stores/${storeId}/shipping/accounts`, headers)
      .then(r => setAccounts(r.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [storeId]);

  const handlePick = async (account) => {
    setFetchingId(account.id);
    setError(null);
    try {
      if (!account.isDefault) {
        await axios.patch(`${baseURL}/stores/${storeId}/shipping/accounts/${account.id}/default`, {}, headers);
      }
      const { data: rates } = await axios.get(`${baseURL}/stores/${storeId}/shipping/rates`, headers);
      onApplied(Array.isArray(rates) ? rates : [], account);
      onClose();
    } catch (e) {
      console.error(e);
      setError(t('fetchRates.fetch_error'));
    } finally { setFetchingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Download className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">{t('fetchRates.button')}</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('fetchRates.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-xs font-semibold">
            <ShieldX className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Accounts list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ShieldX className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-white">{t('accounts.none_title')}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{t('fetchRates.none_hint')}</p>
              <button
                onClick={() => { onClose(); navigate('/dashboard/settings'); }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                {t('accounts.goto_settings')}
              </button>
            </div>
          ) : (
            accounts.map(account => (
              <button
                key={account.id}
                onClick={() => handlePick(account)}
                disabled={!!fetchingId}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-${isRtl ? 'right' : 'left'} transition-all disabled:opacity-60 ${
                  account.isDefault
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20'
                    : 'border-gray-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${account.isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  <Truck className={`w-4 h-4 ${account.isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{account.accountName}</p>
                    {account.isDefault && <Star className="w-3 h-3 text-indigo-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{account.providerName} · {account.isVerified ? t('accounts.verified_badge') : t('accounts.unverified_badge')}</p>
                </div>
                {fetchingId === account.id && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Sub-component: Active provider banner
// ─────────────────────────────────────────────
function ActiveAccountBanner({ settings, onChangeAccount }) {
  const { t } = useTranslation('translation', { keyPrefix: 'shipping' });
  if (!settings?.configured) return null;

  const { metadata, isVerified, providerName, accountName } = settings;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border mb-5 ${
      isVerified
        ? 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
        : 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
        {metadata?.logo && metadata.logo !== '#' ? (
          <img src={metadata.logo} alt={providerName} className="w-8 h-8 object-contain" />
        ) : (
          <Truck className={`w-5 h-5 ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-gray-800 dark:text-white">{accountName ?? metadata?.title ?? providerName}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isVerified
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          }`}>
            {isVerified ? t('provider.active') : t('provider.unverified')}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{metadata?.description ?? providerName}</p>
      </div>

      <button
        onClick={onChangeAccount}
        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shrink-0"
      >
        <Settings2 className="w-3.5 h-3.5" />
        {t('provider.change')}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────
export default function Shipping() {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'shipping' });
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const storeId = localStorage.getItem('storeId');
  const headers = useAuthHeaders();

  const [wilayas,          setWilayas]          = useState([]);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isInitializing,   setIsInitializing]   = useState(false);
  const [isSavingAll,      setIsSavingAll]      = useState(false);
  const [toggleLoading,    setToggleLoading]    = useState(null);
  const [saveLoading,      setSaveLoading]      = useState(null);
  const [toast,            setToast]            = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showRatesModal,   setShowRatesModal]   = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [providerSettings, setProviderSettings] = useState(null);
  const [bulkHome,         setBulkHome]         = useState('');
  const [bulkOffice,       setBulkOffice]       = useState('');
  const [bulkReturn,       setBulkReturn]       = useState('');
  const [selectedIds,      setSelectedIds]      = useState(new Set());
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [isDeleting,       setIsDeleting]       = useState(false);
  const [isBulkToggling,   setIsBulkToggling]   = useState(false);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProviderSettings = async () => {
    if (!storeId) return;
    try {
      const { data } = await axios.get(`${baseURL}/stores/${storeId}/shipping/settings`, headers);
      setProviderSettings(data);
    } catch { setProviderSettings(null); }
  };

  const getShipping = async () => {
    try {
      const { data } = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
      setWilayas(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات الشحن:', error);
      showToast('error', t('toast.fetch_error'));
    }
  };

  useEffect(() => {
    getShipping();
    loadProviderSettings();
  }, []);

  const handleCreateAll = async () => {
    setIsInitializing(true);
    try {
      const getResponse = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
      let finalData = getResponse.data;
      if (!finalData || finalData.length === 0) {
        await axios.get(`${baseURL}/shipping/create-shipping`, headers);
        const refreshResponse = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
        finalData = refreshResponse.data;
      }
      setWilayas(finalData);
      showToast('success', t('toast.init_success'));
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 409) {
        const fallback = await axios.get(`${baseURL}/shipping/get-shipping`, headers);
        setWilayas(fallback.data);
        showToast('success', t('toast.init_loaded'));
      } else {
        showToast('error', t('toast.init_error'));
      }
    } finally { setIsInitializing(false); }
  };

  const handleMissingAdded = (newWilayas, addedCount) => {
    setWilayas(newWilayas);
    showToast('success', t('toast.add_missing_success', { count: addedCount }));
  };

  const handleSaveRow = async (wilaya) => {
    setSaveLoading(wilaya.id);
    try {
      await axios.post(
        `${baseURL}/shipping/update-shipping`,
        [{ wilayaId: wilaya.id, priceHome: wilaya.livraisonHome, priceOffice: wilaya.livraisonOfice, priceReturn: wilaya.livraisonReturn, isActive: wilaya.isActive }],
        headers,
      );
      showToast('success', t('toast.save_success', { name: wilaya.name }));
    } catch { showToast('error', t('toast.save_error', { name: wilaya.name })); }
    finally { setSaveLoading(null); }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      const payload = wilayas.map(w => ({ wilayaId: w.id, priceHome: w.livraisonHome, priceOffice: w.livraisonOfice, priceReturn: w.livraisonReturn, isActive: w.isActive }));
      await axios.post(`${baseURL}/shipping/update-shipping`, payload, headers);
      showToast('success', t('toast.save_all_success'));
    } catch { showToast('error', t('toast.save_all_error')); }
    finally { setIsSavingAll(false); }
  };

  const handlePriceChange = (id, field, value) =>
    setWilayas(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const handleRatesApplied = (rates, account) => {
    let matched = 0;
    setWilayas(prev => prev.map(w => {
      const rate = findRateForWilaya(rates, w.code ?? w.id);
      if (!rate) return w;
      const { home, office } = extractHomeOfficePrices(rate);
      if (home === undefined && office === undefined) return w;
      matched += 1;
      return {
        ...w,
        livraisonHome:  home   ?? w.livraisonHome,
        livraisonOfice: office ?? w.livraisonOfice,
      };
    }));
    if (matched > 0) {
      showToast('success', t('fetchRates.applied_success', { count: matched, account: account.accountName }));
    } else {
      showToast('error', t('fetchRates.applied_none', { account: account.accountName }));
    }
  };

  const toggleStatus = async (id) => {
    const wilaya = wilayas.find(w => w.id === id);
    if (!wilaya) return;
    setToggleLoading(id);
    try {
      await axios.post(`${baseURL}/shipping/update-shipping`, [{ wilayaId: id, isActive: !wilaya.isActive }], headers);
      await getShipping();
    } catch { showToast('error', t('toast.toggle_error')); }
    finally { setToggleLoading(null); }
  };

  const filteredWilayas = wilayas.filter(
    w => w.name.includes(searchQuery) || String(w.code ?? w.id).includes(searchQuery)
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const allSelected = filteredWilayas.length > 0 && filteredWilayas.every(w => prev.has(w.id));
      return allSelected ? new Set() : new Set(filteredWilayas.map(w => w.id));
    });
  };

  const requestDeleteRow = (wilaya) => setDeleteTarget({ ids: [wilaya.id], names: [wilaya.name] });

  const requestDeleteSelected = () => {
    const names = wilayas.filter(w => selectedIds.has(w.id)).map(w => w.name);
    setDeleteTarget({ ids: Array.from(selectedIds), names });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.post(`${baseURL}/shipping/delete-shipping`, { wilayaIds: deleteTarget.ids }, headers);
      setWilayas(prev => prev.filter(w => !deleteTarget.ids.includes(w.id)));
      setSelectedIds(prev => {
        const next = new Set(prev);
        deleteTarget.ids.forEach(id => next.delete(id));
        return next;
      });
      showToast('success', t('toast.delete_success', { count: deleteTarget.ids.length }));
      setDeleteTarget(null);
    } catch { showToast('error', t('toast.delete_error')); }
    finally { setIsDeleting(false); }
  };

  const setSelectedActive = async (isActive) => {
    const ids = Array.from(selectedIds);
    setIsBulkToggling(true);
    try {
      await axios.post(
        `${baseURL}/shipping/update-shipping`,
        ids.map(id => ({ wilayaId: id, isActive })),
        headers,
      );
      setWilayas(prev => prev.map(w => (ids.includes(w.id) ? { ...w, isActive } : w)));
      showToast('success', t(isActive ? 'toast.activate_selected_success' : 'toast.deactivate_selected_success', { count: ids.length }));
    } catch { showToast('error', t(isActive ? 'toast.activate_selected_error' : 'toast.deactivate_selected_error')); }
    finally { setIsBulkToggling(false); }
  };

  const applyBulkPrices = () => {
    if (bulkHome === '' && bulkOffice === '' && bulkReturn === '') {
      showToast('error', t('bulk.apply_empty'));
      return;
    }
    const targetIds = new Set(filteredWilayas.map(w => w.id));
    setWilayas(prev => prev.map(w => (
      targetIds.has(w.id)
        ? {
            ...w,
            livraisonHome:   bulkHome   !== '' ? bulkHome   : w.livraisonHome,
            livraisonOfice:  bulkOffice !== '' ? bulkOffice : w.livraisonOfice,
            livraisonReturn: bulkReturn !== '' ? bulkReturn : w.livraisonReturn,
          }
        : w
    )));
    setBulkHome('');
    setBulkOffice('');
    setBulkReturn('');
    showToast('success', t('bulk.apply_success', { count: targetIds.size }));
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 p-4 md:p-8 font-sans">

      {/* ── Account selector modal ── */}
      {showAccountModal && storeId && (
        <AccountSelectorModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          onClose={() => setShowAccountModal(false)}
          onSelected={loadProviderSettings}
        />
      )}

      {/* ── Fetch rates modal ── */}
      {showRatesModal && storeId && (
        <FetchRatesModal
          storeId={storeId}
          headers={headers}
          isRtl={isRtl}
          onClose={() => setShowRatesModal(false)}
          onApplied={(rates, account) => { handleRatesApplied(rates, account); loadProviderSettings(); }}
        />
      )}

      {/* ── Add missing wilayas modal ── */}
      {showMissingModal && (
        <AddMissingWilayasModal
          headers={headers}
          isRtl={isRtl}
          existingIds={new Set(wilayas.map(w => w.id))}
          onClose={() => setShowMissingModal(false)}
          onAdded={handleMissingAdded}
        />
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          names={deleteTarget.names}
          isRtl={isRtl}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 ${isRtl ? 'left-5' : 'right-5'} z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {storeId && (
            <button
              onClick={() => setShowRatesModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              {t('fetchRates.button')}
            </button>
          )}

          {wilayas.length > 0 && (
            <button
              onClick={() => setShowMissingModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('add_missing_btn')}
            </button>
          )}

          {wilayas.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('save_all')}
            </button>
          )}
        </div>
      </div>

      {/* ── Active account banner ── */}
      {storeId && (
        <ActiveAccountBanner
          settings={providerSettings}
          onChangeAccount={() => setShowAccountModal(true)}
        />
      )}

      {/* ── No account warning ── */}
      {storeId && providerSettings && !providerSettings.configured && (
        <div className="flex items-center gap-3 px-5 py-4 mb-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
          <ShieldX className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('provider.not_configured')}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70">{t('provider.not_configured_hint')}</p>
          </div>
          <button onClick={() => setShowAccountModal(true)} className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold transition-all">
            {t('provider.select')}
          </button>
        </div>
      )}

      {/* ── Search & Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl py-3 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 dark:focus:border-indigo-600 dark:text-white text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-600 transition-all shadow-sm`}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all">
          <Filter className="w-4 h-4" /> {t('filter_region')}
        </button>
        <button onClick={getShipping} className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all" title={t('refresh')}>
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Bulk price bar ── */}
      {wilayas.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white">{t('bulk.title')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('bulk.subtitle')}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <input
              type="number" min="0" dir="ltr"
              value={bulkHome}
              onChange={(e) => setBulkHome(e.target.value)}
              placeholder={t('bulk.home_placeholder')}
              className="w-full sm:w-28 border rounded-xl py-2 px-3 text-sm font-bold outline-none bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
            />
            <input
              type="number" min="0" dir="ltr"
              value={bulkOffice}
              onChange={(e) => setBulkOffice(e.target.value)}
              placeholder={t('bulk.office_placeholder')}
              className="w-full sm:w-28 border rounded-xl py-2 px-3 text-sm font-bold outline-none bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
            />
            <input
              type="number" min="0" dir="ltr"
              value={bulkReturn}
              onChange={(e) => setBulkReturn(e.target.value)}
              placeholder={t('bulk.return_placeholder')}
              className="w-full sm:w-28 border rounded-xl py-2 px-3 text-sm font-bold outline-none bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
            />
          </div>
          <button
            onClick={applyBulkPrices}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
          >
            <Copy className="w-4 h-4" />
            {t('bulk.apply_btn', { count: filteredWilayas.length })}
          </button>
        </div>
      )}

      {/* ── Selection toolbar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 mb-5 px-5 py-3 bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{t('selected_count', { count: selectedIds.size })}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              {t('clear_selection')}
            </button>
            <button
              onClick={() => setSelectedActive(true)}
              disabled={isBulkToggling}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60"
            >
              {isBulkToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t('activate_selected')}
            </button>
            <button
              onClick={() => setSelectedActive(false)}
              disabled={isBulkToggling}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-60"
            >
              {isBulkToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
              {t('deactivate_selected')}
            </button>
            <button
              onClick={requestDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('delete_selected')}
            </button>
          </div>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filteredWilayas.length > 0 && filteredWilayas.every(w => selectedIds.has(w.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3 text-start text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('col_state')}</th>
                <th className="px-4 py-3 text-start text-xs font-bold text-indigo-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5" />{t('col_home')}</div>
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{t('col_office')}</div>
                </th>
                <th className="px-4 py-3 text-start text-xs font-bold text-rose-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5" />{t('col_return')}</div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('col_status')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody>
              {wilayas.length === 0 ? (
                <EmptyState onInitialize={handleCreateAll} isLoading={isInitializing} />
              ) : filteredWilayas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 dark:text-zinc-600 text-sm font-medium">{t('no_results')}</td>
                </tr>
              ) : filteredWilayas.map(wilaya => (
                <WilayaRow
                  key={wilaya.id}
                  wilaya={wilaya}
                  onPriceChange={handlePriceChange}
                  onToggle={toggleStatus}
                  onSave={handleSaveRow}
                  onDelete={requestDeleteRow}
                  toggleLoading={toggleLoading}
                  saveLoading={saveLoading}
                  isSelected={selectedIds.has(wilaya.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </tbody>
          </table>
        </div>

        {wilayas.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
            <p className="text-xs text-gray-400 dark:text-zinc-500">{t('note')}</p>
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60"
            >
              {isSavingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {t('bulk_save')}
            </button>
          </div>
        )}
      </div>

      {wilayas.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-3 text-center">
          {t('count', { filtered: filteredWilayas.length, total: wilayas.length })}
        </p>
      )}
    </div>
  );
}