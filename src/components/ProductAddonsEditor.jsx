import React from 'react';
import { Plus, Trash2, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// محرر «الإضافات» في نموذج المنتج: يختار الزبون منها ما يشاء، وسعر كل إضافة يُضاف لسعر الوحدة
// (مثلاً: دجاج إضافي +300، صلصة حارة +0)
export default function ProductAddonsEditor({ value = [], onChange, isRtl }) {
  const { t } = useTranslation('translation', { keyPrefix: 'products.addons' });

  const update = (id, field, val) => onChange(value.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  const remove = (id) => onChange(value.filter((a) => a.id !== id));
  const add = () => onChange([...value, { id: `ad-${Date.now()}`, name: '', price: '', isActive: true }]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 p-3">
      <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-300 mb-3">
        <PlusCircle size={14} className="text-orange-500" /> {t('desc')}
      </p>

      {value.length > 0 && (
        <div className="space-y-2 mb-3">
          {value.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <input
                value={a.name}
                onChange={(e) => update(a.id, 'name', e.target.value)}
                placeholder={t('name_placeholder')}
                maxLength={100}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <div className="relative w-28 shrink-0" dir="ltr">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">+</span>
                <input
                  type="number" min="0"
                  value={a.price}
                  onChange={(e) => update(a.id, 'price', e.target.value)}
                  placeholder="0"
                  className="w-full pl-6 pr-2 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <button type="button" title={a.isActive === false ? t('enable') : t('disable')}
                onClick={() => update(a.id, 'isActive', a.isActive === false)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${a.isActive === false ? 'bg-gray-300 dark:bg-zinc-700' : 'bg-orange-500'}`}>
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${a.isActive === false ? (isRtl ? '-translate-x-1' : 'translate-x-1') : (isRtl ? '-translate-x-[18px]' : 'translate-x-[18px]')}`} />
              </button>
              <button type="button" onClick={() => remove(a.id)} title={t('remove')}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={add}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/10">
        <Plus size={14} /> {t('add')}
      </button>
    </div>
  );
}

