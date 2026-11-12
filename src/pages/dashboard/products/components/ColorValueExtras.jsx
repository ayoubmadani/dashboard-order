import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

// قيمة لون: اسمها (أحمر) + صورة المنتج المربوطة بها (تظهر للزبون عند اختيار هذا اللون)
export function ColorValueExtras({ variant, images, t, onName, onImage, withImage = true }) {
  const [picking, setPicking] = useState(false);
  return (
    <>
      <input type="text" value={variant.name && variant.name !== variant.value ? variant.name : ''}
        onChange={(e) => onName(e.target.value)} placeholder={t('attributes.color_name')}
        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 outline-none border-gray-200 dark:border-zinc-700 focus:border-purple-400" />
      {withImage && (
        <button type="button" onClick={() => setPicking(true)} title={t('attributes.link_image')}
          className="w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center text-gray-400 hover:border-purple-400">
          {variant.imageUrl ? <img src={variant.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={15} />}
        </button>
      )}
      {picking && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setPicking(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-gray-900 dark:text-white">{t('attributes.pick_image')}</p>
              <button type="button" onClick={() => setPicking(false)} className="p-1.5 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            {images.length === 0 && <p className="text-center text-sm text-gray-400 py-6">{t('attributes.no_product_images')}</p>}
            <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {images.map((src) => (
                <button key={src} type="button" onClick={() => { onImage(src); setPicking(false); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 ${variant.imageUrl === src ? 'border-purple-500' : 'border-transparent'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {variant.imageUrl && (
              <button type="button" onClick={() => { onImage(null); setPicking(false); }}
                className="w-full py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-500">{t('attributes.unlink_image')}</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
