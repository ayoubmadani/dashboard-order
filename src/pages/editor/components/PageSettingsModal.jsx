import { useTranslation } from 'react-i18next';
import { X, Settings2 } from 'lucide-react';

// Page-wide styling (background/max width/padding) applied once to the
// whole block stack in Canvas.jsx, instead of every block managing its own
// container. Edits here just update local `settings` state like any other
// prop change — persisting still goes through the editor's normal Save
// button, same as block edits.
export default function PageSettingsModal({ open, onClose, settings, onChange }) {
  const { t } = useTranslation();
  if (!open) return null;

  const update = (patch) => onChange((prev) => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
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

        <div className="space-y-4">
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
              placeholder="1024"
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
        </div>
      </div>
    </div>
  );
}
