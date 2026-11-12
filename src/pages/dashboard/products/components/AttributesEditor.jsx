import { useState } from 'react';
import { AlertCircle, ImagePlus, Palette, Plus, Tag, Trash2, X } from 'lucide-react';
import {
  addValue, editText, linkImage, modeOf, newAttribute, removeValue, setColor, setMode, setValueName,
} from './attributeEditing';

// خصائص المنتج بنفس تصميم تطبيق الهاتف: اسم الخاصية + «إضافة» ← تبويبات نص | لون | صورة،
// زر الإضافة فوق القائمة، أسطر مرقّمة، ولكل قيمة صورة من صور المنتج تظهر للزبون عند اختيارها
const small = 'px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-900 outline-none border-gray-200 dark:border-zinc-700 focus:border-indigo-400 text-gray-900 dark:text-white';

function ImagePicker({ images, current, t, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm text-gray-900 dark:text-white">{t('attributes.pick_image')}</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        {images.length === 0 && <p className="text-center text-sm text-gray-400 py-6">{t('attributes.no_product_images')}</p>}
        <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
          {images.map((src) => (
            <button key={src} type="button" onClick={() => onPick(src)}
              className={`aspect-square rounded-xl overflow-hidden border-2 ${current === src ? 'border-indigo-500' : 'border-transparent'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        {current && (
          <button type="button" onClick={() => onPick(null)}
            className="w-full py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-semibold text-gray-500">{t('attributes.unlink_image')}</button>
        )}
      </div>
    </div>
  );
}

function AttributeCard({ attr, images, errors, t, onChange, onRemove, onPickLibrary }) {
  const [pickFor, setPickFor] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const mode = modeOf(attr);
  const err = (k) => errors[`${k}`];

  const add = () => {
    if (mode === 'color') return onChange(addValue(attr, '#000000'));
    const next = addValue(attr, '');
    const id = next.variants[next.variants.length - 1].id;
    onChange(next);
    if (mode === 'image') onPickLibrary(attr.id, id); // تُختار الصورة مباشرة
    else setFocusId(id);
  };

  const linkButton = (v) => (
    <button type="button" onClick={() => setPickFor(v.id)} title={t('attributes.link_image')}
      className="w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center text-gray-400 hover:border-indigo-400">
      {v.imageUrl ? <img src={v.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={15} />}
    </button>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50/70 dark:bg-zinc-800/40 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${attr.type === 'color' ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'}`}>
          {attr.type === 'color' ? <Palette size={15} /> : <Tag size={15} />}
        </span>
        <input value={attr.name} onChange={(e) => onChange({ ...attr, name: e.target.value })}
          className={`${small} flex-1 min-w-0 font-semibold ${err(`attr_${attr.id}`) ? '!border-rose-400' : ''}`} />
        <button type="button" onClick={onRemove} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 size={14} /></button>
      </div>
      {err(`attr_${attr.id}`) && <p className="flex items-center gap-1 text-xs text-rose-500 font-medium"><AlertCircle size={12} />{err(`attr_${attr.id}`)}</p>}

      {attr.type === 'color' && (
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
          {['text', 'color', 'image'].map((m) => (
            <button key={m} type="button" onClick={() => onChange(setMode(attr, m))}
              className={`py-1.5 rounded-lg text-xs font-bold ${mode === m ? 'bg-white dark:bg-zinc-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              {t(`attributes.mode_${m}`)}
            </button>
          ))}
        </div>
      )}

      {/* زر الإضافة فوق القائمة؛ القيمة الجديدة تُضاف في أسفلها */}
      <button type="button" onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:border-indigo-400">
        {mode === 'color' ? <Palette size={15} /> : mode === 'image' ? <ImagePlus size={15} /> : <Plus size={15} />}
        {t(mode === 'color' ? 'attributes.add_color_value' : mode === 'image' ? 'attributes.add_image_value' : 'attributes.add_value')}
      </button>

      {attr.variants.length > 0 && (
        <div className="space-y-1.5">
          {attr.variants.map((v, i) => (
            <div key={v.id}>
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-400" dir="ltr">{i + 1}</span>
                {mode === 'text' && (
                  <input value={v.value} autoFocus={focusId === v.id} onChange={(e) => onChange(editText(attr, v.id, e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={t('attributes.value_placeholder')}
                    className={`${small} flex-1 min-w-0 ${err(`variant_${v.id}`) ? '!border-rose-400' : ''}`} />
                )}
                {mode === 'color' && (
                  <>
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(v.value) ? v.value : '#000000'} onChange={(e) => onChange(setColor(attr, v.id, e.target.value))}
                      className={`w-9 h-9 shrink-0 rounded-lg cursor-pointer border p-0.5 bg-white ${err(`variant_${v.id}`) ? 'border-rose-400' : 'border-gray-200 dark:border-zinc-700'}`} />
                    <input value={v.name && v.name !== v.value ? v.name : ''} onChange={(e) => onChange(setValueName(attr, v.id, e.target.value))}
                      placeholder={t('attributes.color_name')} className={`${small} flex-1 min-w-0`} />
                  </>
                )}
                {mode === 'image' && (
                  <>
                    <button type="button" onClick={() => onPickLibrary(attr.id, v.id)} title={t('attributes.change_image')}
                      className="w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center text-gray-400">
                      {v.value ? <img src={v.value} alt="" className="w-full h-full object-cover" /> : <ImagePlus size={15} />}
                    </button>
                    <input value={v.name && v.name !== v.value ? v.name : ''} onChange={(e) => onChange(setValueName(attr, v.id, e.target.value))}
                      placeholder={t('attributes.value_name')} className={`${small} flex-1 min-w-0`} />
                  </>
                )}
                {mode !== 'image' && linkButton(v)}
                <button type="button" onClick={() => onChange(removeValue(attr, v.id))} className="p-1.5 text-gray-400 hover:text-rose-500"><X size={15} /></button>
              </div>
              {err(`variant_${v.id}`) && <p className="ps-7 text-[11px] text-rose-500 font-medium">{err(`variant_${v.id}`)}</p>}
            </div>
          ))}
        </div>
      )}
      {err(`attr_empty_${attr.id}`) && <p className="flex items-center gap-1 text-xs text-rose-500 font-medium"><AlertCircle size={11} />{err(`attr_empty_${attr.id}`)}</p>}

      {pickFor && (
        <ImagePicker images={images} t={t} current={attr.variants.find((x) => x.id === pickFor)?.imageUrl}
          onPick={(url) => { onChange(linkImage(attr, pickFor, url)); setPickFor(null); }} onClose={() => setPickFor(null)} />
      )}
    </div>
  );
}

function NewAttributeRow({ attributes, t, onAdd }) {
  const [name, setName] = useState('');
  const [dup, setDup] = useState(false);
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (attributes.some((a) => String(a.name || '').trim().toLowerCase() === n.toLowerCase())) { setDup(true); return; }
    onAdd(n); setName(''); setDup(false);
  };
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => { setName(e.target.value); setDup(false); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={t('attributes.new_name_ph')} className={`${small} flex-1 min-w-0 ${dup ? '!border-rose-400' : ''}`} />
        <button type="button" onClick={add} disabled={!name.trim()}
          className="shrink-0 flex items-center gap-1 px-4 rounded-lg bg-indigo-600 text-white text-sm font-bold disabled:opacity-40">
          <Plus size={15} />{t('attributes.new_add')}
        </button>
      </div>
      {dup && <p className="text-[11px] text-rose-500 font-medium">{t('attributes.name_duplicate')}</p>}
    </div>
  );
}

/**
 * attributes/onChange: قائمة الخصائص كاملة. images: صور المنتج (للربط).
 * onPickLibrary(attrId, variantId): يفتح مكتبة الصور لقيمة «صورة» (الصفحة تضع الصورة عبر setImage)
 */
export default function AttributesEditor({ attributes, onChange, images = [], errors = {}, t, onPickLibrary }) {
  return (
    <div className="space-y-4">
      {!attributes.length && <p className="text-center text-sm text-gray-400 py-2">{t('attributes.none_yet')}</p>}
      {attributes.map((a) => (
        <AttributeCard key={a.id} attr={a} images={images} errors={errors} t={t} onPickLibrary={onPickLibrary}
          onChange={(next) => onChange(attributes.map((x) => (x.id === a.id ? next : x)))}
          onRemove={() => onChange(attributes.filter((x) => x.id !== a.id))} />
      ))}
      <NewAttributeRow attributes={attributes} t={t} onAdd={(name) => onChange([...attributes, newAttribute(name)])} />
    </div>
  );
}
