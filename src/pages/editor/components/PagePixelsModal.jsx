import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Radar, Plus, Trash2, Loader2, Facebook, Music2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

const PIXEL_TYPES = [
  { id: 'facebook', labelKey: 'types.facebook', icon: Facebook, color: '#1877F2' },
  { id: 'tiktok', labelKey: 'types.tiktok', icon: Music2, color: '#000000' },
  { id: 'google', labelKey: 'types.google', icon: FcGoogle, color: '#4285F4' },
];

const EMPTY_FORM = { type: 'facebook', pixelId: '', name: '' };

// Pixels created here are always scope: 'landing_page', pinned to this exact
// page (builderPageId) — the store-wide picker lives in PixelManager.jsx
// instead, which never sets a scope/builderPageId at all. Same pixelId can
// exist in both places at once (see store.service.ts's addPixel), so a
// merchant can reuse one tracking ID for both the store and one page.
export default function PagePixelsModal({ open, onClose, storeId, pageId }) {
  const { t } = useTranslation('translation', { keyPrefix: 'editor.pixels' });
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${getAccessToken()}` });

  const fetchPixels = useCallback(async () => {
    if (!storeId) { setPixels([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/stores/${storeId}/pixels`, { headers: authHeaders() });
      const all = res.data?.data || res.data || [];
      setPixels(all.filter((p) => p.scope === 'landing_page' && p.builderPageId === pageId));
    } catch {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [storeId, pageId, t]);

  useEffect(() => {
    if (open) fetchPixels();
  }, [open, fetchPixels]);

  if (!open) return null;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!storeId || !pageId || !form.pixelId.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${baseURL}/stores/${storeId}/pixels`,
        { type: form.type, pixelId: form.pixelId.trim(), name: form.name.trim() || undefined, scope: 'landing_page', builderPageId: pageId },
        { headers: authHeaders() },
      );
      toast.success(t('saveSuccess'));
      resetForm();
      fetchPixels();
    } catch (error) {
      toast.error(error.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pixelId) => {
    setDeletingId(pixelId);
    try {
      await axios.delete(`${baseURL}/stores/pixels/${pixelId}`, { headers: authHeaders() });
      toast.success(t('deleteSuccess'));
      setConfirmDeleteId(null);
      fetchPixels();
    } catch {
      toast.error(t('errors.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type) => {
    const def = PIXEL_TYPES.find((p) => p.id === type);
    const Icon = def?.icon || Facebook;
    return <Icon size={18} style={{ color: def?.color }} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
              <Radar size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('title')}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{t('subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {pixels.length === 0 && !showForm && (
              <p className="text-xs text-gray-400 text-center py-6">{t('emptyState')}</p>
            )}
            {pixels.map((pixel) => (
              <div key={pixel.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-white dark:bg-zinc-700 rounded-lg shrink-0">{getIcon(pixel.type)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{pixel.name || t(`types.${pixel.type}`)}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{t('idLabel')}: {pixel.pixelId}</p>
                  </div>
                </div>
                {confirmDeleteId === pixel.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDelete(pixel.id)}
                      disabled={deletingId === pixel.id}
                      className="px-2 py-1 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                    >
                      {deletingId === pixel.id ? <Loader2 size={14} className="animate-spin" /> : t('confirm')}
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg">
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(pixel.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                    title={t('delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {PIXEL_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: type.id }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                    form.type === type.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <type.icon size={16} style={{ color: type.color }} />
                  {t(type.labelKey)}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('form.namePlaceholder')}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
            />
            <input
              type="text"
              value={form.pixelId}
              onChange={(e) => setForm((prev) => ({ ...prev, pixelId: e.target.value }))}
              placeholder={form.type === 'google' ? t('form.pixelIdPlaceholderGoogle') : t('form.pixelIdPlaceholder')}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
              required
            />
            <div className="flex gap-2">
              <button type="button" onClick={resetForm} className="flex-1 px-3 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-zinc-800 rounded-xl">
                {t('cancel')}
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-3 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {t('form.addPixel')}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            disabled={!storeId}
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={16} />
            {t('addNew')}
          </button>
        )}
      </div>
    </div>
  );
}
