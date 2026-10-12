import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Palette, Check, Loader2, Crown, LayoutTemplate } from 'lucide-react';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

// اختيار ثيم المتجر عند إنشائه: الثيمات التي يملكها التاجر + ثيمات خطته (بدون شراء).
// value = null يعني الثيم الافتراضي.
export default function StoreThemePicker({ value, onChange, sectionClass, sectionTitle }) {
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'stores.theme_picker' });
  const lang = ['ar', 'fr', 'en'].includes(i18n.language) ? i18n.language : 'ar';
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${baseURL}/theme/available`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
      .then(({ data }) => setThemes(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }, []);

  const card = (selected) =>
    `relative text-start rounded-2xl border-2 overflow-hidden transition-all ${selected
      ? 'border-indigo-600 ring-4 ring-indigo-500/15'
      : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300'}`;

  const Tick = () => (
    <span className="absolute top-2 end-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
      <Check size={14} />
    </span>
  );

  return (
    <div className={sectionClass}>
      <h2 className={sectionTitle}>
        <Palette size={20} className="text-indigo-600" />
        {t('title')}
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 -mt-4 mb-5">{t('subtitle')}</p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* الافتراضي */}
          <button type="button" onClick={() => onChange(null)} className={card(!value)}>
            <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <LayoutTemplate size={32} className="text-gray-300 dark:text-zinc-600" />
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{t('default_name')}</p>
              <p className="text-xs text-gray-400">{t('default_desc')}</p>
            </div>
            {!value && <Tick />}
          </button>

          {themes.map((th) => {
            const selected = value === th.id;
            const name = th.name?.[lang] || th.name?.ar || th.slug;
            return (
              <button key={th.id} type="button" onClick={() => onChange(th.id)} className={card(selected)}>
                <div className="aspect-[4/3] bg-gray-100 dark:bg-zinc-800">
                  {th.imageUrl && <img src={th.imageUrl} alt={name} loading="lazy" className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={name}>{name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    {th.source === 'owned' ? <><Crown size={11} className="text-amber-500" /> {t('owned')}</> : t('in_plan')}
                  </p>
                </div>
                {selected && <Tick />}
              </button>
            );
          })}
        </div>
      )}

      {!loading && themes.length === 0 && (
        <p className="text-xs text-gray-400 mt-3">{t('none')}</p>
      )}
    </div>
  );
}
