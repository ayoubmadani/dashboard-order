import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { X, Settings2, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import ProductPicker from './ProductPicker';

// منتج الصفحة: يُحفظ فوراً (ليس جزءاً من شجرة الصفحة)، والمتجر يقرؤه مباشرة بلا إعادة نشر
function PageProduct({ pageId, productId, onProductChange }) {
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    if (!productId) { setProduct(null); setMissing(false); return undefined; }
    axios.get(`${baseURL}/builder-pages/product-info/${productId}`)
      .then((r) => { if (alive) { setProduct(r.data); setMissing(false); } })
      .catch((err) => { if (alive) { setProduct(null); setMissing(err?.response?.status === 404); } });
    return () => { alive = false; };
  }, [productId]);

  const choose = async (p) => {
    setSaving(true);
    setError('');
    try {
      await axios.patch(`${baseURL}/builder-pages/${pageId}/product`, { productId: p.id }, { headers: { Authorization: `Bearer ${getAccessToken()}` } });
      onProductChange(p.id);
      setPicking(false);
    } catch (err) {
      const m = err?.response?.data?.message;
      setError((Array.isArray(m) ? m[0] : m) || t('editor.pageSettings.productError'));
    } finally {
      setSaving(false);
    }
  };

  const image = product?.productImage || product?.images?.[0];
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">{t('editor.pageSettings.product')}</label>
      {missing && (
        <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg p-2 mb-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {t('editor.pageSettings.productMissing')}
        </p>
      )}
      <button type="button" onClick={() => { setError(''); setPicking(true); }}
        className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-start ${productId && !missing ? 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700' : 'border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-emerald-500'}`}>
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0 flex items-center justify-center">
          {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-gray-400" />}
        </div>
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
          {product?.name || t('editor.pageSettings.noProduct')}
        </span>
        <span className="text-xs font-bold text-emerald-600">{t('editor.pageSettings.changeProduct')}</span>
      </button>
      {picking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onMouseDown={() => !saving && setPicking(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('editor.pageSettings.pickProduct')}</h4>
              <button type="button" onClick={() => setPicking(false)} disabled={saving} className="p-1 text-gray-400 hover:text-gray-600">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <X size={18} />}
              </button>
            </div>
            {error && (
              <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg p-2 mb-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
              </p>
            )}
            <ProductPicker selectedProductId={productId} onSelect={choose} />
          </div>
        </div>
      )}
      {error && <p className="text-xs font-semibold text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
}

// Page-wide styling (background/max width/padding) applied once to the
// whole block stack in Canvas.jsx, instead of every block managing its own
// container. Edits here just update local `settings` state like any other
// prop change — persisting still goes through the editor's normal Save
// button, same as block edits.
export default function PageSettingsModal({ open, onClose, settings, onChange, pageId, productId, onProductChange }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = (patch) => onChange((prev) => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-sm max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
              <Settings2 size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('editor.pageSettings.title')}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {pageId && pageId !== 'demo' && (
            <PageProduct pageId={pageId} productId={productId} onProductChange={onProductChange} />
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {t('editor.pageSettings.backgroundColor')}
            </label>
            <input
              type="color"
              value={settings?.backgroundColor || '#ffffff'}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {t('editor.pageSettings.maxWidth')}
            </label>
            <input
              type="number"
              min={320}
              value={settings?.maxWidth ?? ''}
              placeholder="720"
              onChange={(e) => update({ maxWidth: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {t('editor.pageSettings.padding')}
            </label>
            <input
              type="number"
              min={0}
              value={settings?.padding ?? ''}
              placeholder="0"
              onChange={(e) => update({ padding: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">
              {t('editor.pageSettings.language')}
            </label>
            <select
              value={settings?.language || 'ar'}
              onChange={(e) => update({ language: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ar">{t('editor.pageSettings.languageOptions.ar')}</option>
              <option value="fr">{t('editor.pageSettings.languageOptions.fr')}</option>
              <option value="en">{t('editor.pageSettings.languageOptions.en')}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
