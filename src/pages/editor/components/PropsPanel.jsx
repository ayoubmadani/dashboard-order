import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Trash2, Layers, X, Type, MousePointerClick, ChevronLeft, ChevronRight, Bold, Italic, Underline, Image as ImageIcon, ArrowUp, ArrowDown, Images } from 'lucide-react';
import { componentsMap } from '../blocks/componentsMap';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import ModelImages from '../../../components/ModelImages';
import MobileDrawer from './MobileDrawer';

const TEXT_ELEMENT_FIELDS = [
  { key: 'content', labelKey: 'editor.fields.content', type: 'textarea' },
  { key: 'style', type: 'textStyle' },
  { key: 'color', labelKey: 'editor.fields.color', type: 'color' },
  { key: 'fontSize', labelKey: 'editor.fields.fontSize', type: 'number' },
  { key: 'width', labelKey: 'editor.canvasSection.width', type: 'number', min: 5, max: 100 },
  { key: 'height', labelKey: 'editor.canvasSection.height', type: 'number' },
];

const BUTTON_ELEMENT_FIELDS = [
  { key: 'text', labelKey: 'editor.fields.text', type: 'text' },
  {
    key: 'linkType',
    labelKey: 'editor.fields.linkType',
    type: 'select',
    options: [
      { value: 'external', labelKey: 'editor.fields.linkTypeOptions.external' },
      { value: 'form', labelKey: 'editor.fields.linkTypeOptions.form' },
    ],
  },
  // Only relevant for an external link — jumping to the order form doesn't
  // need a URL, it scrolls to the productForm block already on the page.
  { key: 'link', labelKey: 'editor.fields.buttonLink', type: 'url', showIf: (el) => (el.linkType || 'external') !== 'form' },
  { key: 'backgroundColor', labelKey: 'editor.fields.backgroundColor', type: 'color' },
  { key: 'textColor', labelKey: 'editor.fields.textColor', type: 'color' },
  { key: 'width', labelKey: 'editor.canvasSection.width', type: 'number', min: 5, max: 100 },
  { key: 'height', labelKey: 'editor.canvasSection.height', type: 'number' },
];

const IMAGE_ELEMENT_FIELDS = [
  { key: 'src', labelKey: 'editor.fields.image', type: 'image' },
  { key: 'alt', labelKey: 'editor.fields.alt', type: 'text' },
  { key: 'lockAspectRatio', labelKey: 'editor.fields.lockAspectRatio', type: 'checkbox' },
  { key: 'width', labelKey: 'editor.canvasSection.width', type: 'number', min: 5, max: 100 },
  { key: 'height', labelKey: 'editor.canvasSection.height', type: 'number' },
];

const ELEMENT_ICONS = { button: MousePointerClick, image: ImageIcon, text: Type };

// Classic checkerboard pattern — the only way to visually distinguish
// "transparent" from "opaque white" on a native <input type="color">, which
// has no way to represent alpha/transparency in its own swatch at all.
const CHECKERED_BG =
  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';

function ProductField({ value, onChange }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storeId = localStorage.getItem('storeId');
      if (!storeId) return;
      setLoading(true);
      axios
        .get(`${baseURL}/stores/${storeId}/products?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        })
        .then((res) => setProducts(res.data?.products || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const commonClass =
    'w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all';

  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={loading} className={commonClass}>
      <option value="">{loading ? t('editor.fields.loadingProducts') : t('editor.fields.selectProduct')}</option>
      {products.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

function ImageField({ value, onChange }) {
  const { t } = useTranslation();
  const [libraryOpen, setLibraryOpen] = useState(false);

  return (
    <div className="space-y-2">
      {/* No direct file input here — uploading only happens *inside* the
          library modal (it has its own dropzone), so every image, new or
          reused, goes through the same store-wide media library instead of
          two disconnected upload paths. */}
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className="w-full h-28 object-cover rounded-lg border border-gray-200 dark:border-zinc-700" />
          <button
            onClick={() => onChange('')}
            className="absolute top-1.5 end-1.5 p-1 rounded-md bg-white/90 dark:bg-zinc-900/90 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={13} />
          </button>
          <button
            onClick={() => setLibraryOpen(true)}
            className="absolute inset-x-1.5 bottom-1.5 py-1 rounded-md bg-black/60 text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {t('editor.fields.changeImage')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setLibraryOpen(true)}
          className="w-full h-28 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-all"
        >
          <Images size={18} />
          <span className="text-xs">{t('editor.fields.chooseFromLibrary')}</span>
        </button>
      )}
      <ModelImages
        isOpen={libraryOpen}
        close={() => setLibraryOpen(false)}
        onSelectImage={(img) => { onChange(img.url); setLibraryOpen(false); }}
        initialFolder="landingPage"
      />
    </div>
  );
}

function Field({ field, value, onChange }) {
  const { t } = useTranslation();
  const label = t(field.labelKey);

  const commonClass =
    'w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all';

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
        />
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">{label}</span>
      </label>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">{label}</label>
      {field.type === 'image' && <ImageField value={value} onChange={onChange} />}
      {field.type === 'product' && <ProductField value={value} onChange={onChange} />}
      {field.type === 'textarea' && (
        <textarea
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
        />
      )}
      {field.type === 'text' && (
        <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={commonClass} />
      )}
      {field.type === 'url' && (
        <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={commonClass} placeholder="https://" />
      )}
      {field.type === 'number' && (
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? ''}
          onChange={(e) => {
            if (e.target.value === '') return onChange('');
            let next = Number(e.target.value);
            if (field.min != null) next = Math.max(field.min, next);
            if (field.max != null) next = Math.min(field.max, next);
            onChange(next);
          }}
          className={commonClass}
        />
      )}
      {field.type === 'color' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value && value !== 'transparent' ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={value === 'transparent' ? { backgroundImage: CHECKERED_BG, backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px' } : undefined}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onChange(value === 'transparent' ? '#ffffff' : 'transparent')}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              value === 'transparent'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-500/40'
            }`}
          >
            {t('editor.fields.transparent')}
          </button>
        </div>
      )}
      {field.type === 'select' && (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={commonClass}>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// Renders several related color pickers in one compact row instead of each
// taking its own full-width labeled block — used for productForm, which
// otherwise stacks up to 8 near-identical color fields. Each swatch's own
// label shows as a tooltip rather than a permanent caption to stay compact.
function ColorGroupField({ field, values, onChange }) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">{t(field.groupLabelKey)}</label>
      <div className="flex items-center gap-2">
        {field.items.map((item) => (
          <input
            key={item.key}
            type="color"
            title={t(item.labelKey)}
            value={values[item.key] ?? '#000000'}
            onChange={(e) => onChange(item.key, e.target.value)}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
}

function TextStyleToggles({ element, onChange }) {
  const { t } = useTranslation();
  const isBold = (element.fontWeight ?? 400) >= 600;
  const isItalic = element.fontStyle === 'italic';
  const isUnderline = element.textDecoration === 'underline';

  const toggleClass = (active) =>
    `flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${
      active
        ? 'bg-emerald-500 border-emerald-500 text-white'
        : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-500/40'
    }`;

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5">{t('editor.fields.textStyle')}</label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          title={t('editor.fields.bold')}
          onClick={() => onChange({ fontWeight: isBold ? 400 : 700 })}
          className={toggleClass(isBold)}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          title={t('editor.fields.italic')}
          onClick={() => onChange({ fontStyle: isItalic ? 'normal' : 'italic' })}
          className={toggleClass(isItalic)}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          title={t('editor.fields.underline')}
          onClick={() => onChange({ textDecoration: isUnderline ? 'none' : 'underline' })}
          className={toggleClass(isUnderline)}
        >
          <Underline size={14} />
        </button>
      </div>
    </div>
  );
}

function elementPreviewText(el, t) {
  if (el.type === 'button') return el.text;
  if (el.type === 'image') return el.alt || t('editor.blocks.image.label');
  return el.content;
}

// Whole-page layers panel: every block in page order (top of list = top of
// page), each with up/down controls that change its position in the page —
// an alternative to dragging the block itself around the canvas. The
// currently selected block additionally expands to list its own floating
// elements (text/button/image placed on top of it), with their own
// forward/backward stacking controls, since those aren't reachable at all
// once you're not looking directly at that block's detail view above.
function BlocksList({ blocks, selectedBlockId, onSelectBlock, onReorderBlock, elements, selectedElementId, onSelectElement, onRemoveElement, onMoveElement }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0.5">
      {blocks.map((b, index) => {
        if (!b) return null;
        const bDef = componentsMap[b.type];
        const BlockIcon = bDef?.icon || Layers;
        const isBlockSelected = b.id === selectedBlockId;

        return (
          <div key={b.id ?? `unknown-${index}`}>
            <div
              className={`group w-full flex items-center gap-1 ps-2 pe-1 py-1.5 rounded-lg cursor-pointer transition-colors ${
                isBlockSelected ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-gray-100 dark:hover:bg-zinc-800/60'
              }`}
              onClick={() => onSelectBlock(b.id)}
            >
              <BlockIcon size={13} className={`shrink-0 ${isBlockSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
              <span
                className={`flex-1 text-xs truncate ${
                  isBlockSelected ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-zinc-400'
                }`}
              >
                {bDef ? t(bDef.labelKey) : b.type}
              </span>
              <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReorderBlock(b.id, 'up'); }}
                  disabled={index === 0}
                  className="p-1 rounded text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('editor.fields.moveUp')}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReorderBlock(b.id, 'down'); }}
                  disabled={index === blocks.length - 1}
                  className="p-1 rounded text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('editor.fields.moveDown')}
                >
                  <ArrowDown size={12} />
                </button>
              </div>
            </div>

            {isBlockSelected && elements.length > 0 && (
              <div className="ms-4 ps-2 border-s border-gray-200 dark:border-zinc-800 space-y-0.5 my-0.5">
                {elements.map((el, elIndex) => {
                  const isElSelected = selectedElementId === el.id;
                  const ElementIcon = ELEMENT_ICONS[el.type] || Type;
                  return (
                    <div
                      key={el.id}
                      className={`group w-full flex items-center gap-1 ps-2 pe-1 py-1 rounded-lg cursor-pointer transition-colors ${
                        isElSelected ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                      }`}
                      onClick={() => onSelectElement(el.id)}
                    >
                      <ElementIcon size={11} className={`shrink-0 ${isElSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                      <span
                        className={`flex-1 text-[11px] truncate ${
                          isElSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-zinc-500'
                        }`}
                      >
                        {elementPreviewText(el, t)}
                      </span>
                      <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onMoveElement(el.id, 'backward'); }}
                          disabled={elIndex === 0}
                          className="p-1 rounded text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={t('editor.fields.sendBackward')}
                        >
                          <ArrowDown size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onMoveElement(el.id, 'forward'); }}
                          disabled={elIndex === elements.length - 1}
                          className="p-1 rounded text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={t('editor.fields.bringForward')}
                        >
                          <ArrowUp size={10} />
                        </button>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); onRemoveElement(el.id); }}
                          className="p-1 text-rose-400 hover:text-rose-600"
                        >
                          <X size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// This drawer opens automatically whenever a block is selected (see
// PageEditor.jsx) and closes here or via its own close button.
export default function PropsPanel({ block, blocks = [], onUpdateProps, onDelete, selectedElementId, onSelectElement, onSelectBlock, onReorderBlock, mobileOpen, onMobileClose }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  if (!block) {
    return (
      <MobileDrawer open={mobileOpen} onClose={onMobileClose} widthClass="md:w-72" borderClass="border-s" className="p-4">
        {blocks?.length > 0 ? (
          <BlocksList
            blocks={blocks}
            selectedBlockId={null}
            onSelectBlock={onSelectBlock}
            onReorderBlock={onReorderBlock}
            elements={[]}
            selectedElementId={null}
            onSelectElement={onSelectElement}
            onRemoveElement={() => {}}
            onMoveElement={() => {}}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Layers size={28} className="text-gray-300 dark:text-zinc-700 mb-3" />
            <p className="text-xs text-gray-400 dark:text-zinc-600">{t('editor.propsPanel.empty')}</p>
          </div>
        )}
      </MobileDrawer>
    );
  }

  const def = componentsMap[block.type];

  // Same stale/unknown block type case as Canvas.jsx's CanvasBlock — only
  // offer to delete it instead of crashing on the missing definition.
  if (!def) {
    return (
      <MobileDrawer open={mobileOpen} onClose={onMobileClose} widthClass="md:w-72" borderClass="border-s" className="p-6 items-center justify-center text-center">
        <p className="text-xs text-rose-500 mb-3">{`Unknown block type: ${block.type}`}</p>
        <button
          onClick={() => onDelete(block.id)}
          className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
          title={t('editor.propsPanel.deleteBlock')}
        >
          <Trash2 size={14} />
        </button>
      </MobileDrawer>
    );
  }

  const values = { ...def.defaultProps, ...block.props };
  const elements = Array.isArray(values.elements) ? values.elements : [];
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  const updateElement = (id, patch) => {
    onUpdateProps(block.id, { elements: elements.map((el) => (el.id === id ? { ...el, ...patch } : el)) });
  };

  const removeElement = (id) => {
    onUpdateProps(block.id, { elements: elements.filter((el) => el.id !== id) });
    if (selectedElementId === id) onSelectElement(null);
  };

  // Elements paint in array order — later entries render on top when two
  // overlap — so "priority"/layer order is just reordering this array.
  const moveElement = (id, direction) => {
    const index = elements.findIndex((el) => el.id === id);
    const newIndex = direction === 'forward' ? index + 1 : index - 1;
    if (index === -1 || newIndex < 0 || newIndex >= elements.length) return;
    const next = [...elements];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onUpdateProps(block.id, { elements: next });
  };

  const elementFields = selectedElement?.type === 'button' ? BUTTON_ELEMENT_FIELDS : selectedElement?.type === 'image' ? IMAGE_ELEMENT_FIELDS : TEXT_ELEMENT_FIELDS;
  const ElementHeaderIcon = selectedElement ? ELEMENT_ICONS[selectedElement.type] || Type : Type;
  const elementHeaderLabelKey =
    selectedElement?.type === 'button' ? 'editor.blocks.button.label' : selectedElement?.type === 'image' ? 'editor.blocks.image.label' : 'editor.blocks.text.label';
  const selectedElementIndex = selectedElement ? elements.findIndex((el) => el.id === selectedElement.id) : -1;

  return (
    <MobileDrawer open={mobileOpen} onClose={onMobileClose} widthClass="md:w-72" borderClass="border-s" className="p-4">
      <div className="pb-4 mb-4 border-b border-gray-200 dark:border-zinc-800">
        <BlocksList
          blocks={blocks}
          selectedBlockId={block.id}
          onSelectBlock={onSelectBlock}
          onReorderBlock={onReorderBlock}
          elements={elements}
          selectedElementId={selectedElementId}
          onSelectElement={onSelectElement}
          onRemoveElement={removeElement}
          onMoveElement={moveElement}
        />
      </div>

      {selectedElement ? (
        <>
          <button
            onClick={() => onSelectElement(null)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 hover:underline"
          >
            <BackIcon size={14} /> {t(def.labelKey)}
          </button>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ElementHeaderIcon size={16} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t(elementHeaderLabelKey)}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveElement(selectedElement.id, 'backward')}
                disabled={selectedElementIndex <= 0}
                className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title={t('editor.fields.sendBackward')}
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={() => moveElement(selectedElement.id, 'forward')}
                disabled={selectedElementIndex === -1 || selectedElementIndex >= elements.length - 1}
                className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title={t('editor.fields.bringForward')}
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => removeElement(selectedElement.id)}
                className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                title={t('editor.propsPanel.deleteBlock')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {elementFields
              .filter((field) => !field.showIf || field.showIf(selectedElement))
              .map((field) =>
              field.type === 'textStyle' ? (
                <TextStyleToggles
                  key={field.key}
                  element={selectedElement}
                  onChange={(patch) => updateElement(selectedElement.id, patch)}
                />
              ) : (
                <Field
                  key={field.key}
                  field={field}
                  value={selectedElement[field.key]}
                  onChange={(newValue) => updateElement(selectedElement.id, { [field.key]: newValue })}
                />
              )
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('editor.propsPanel.title')}</p>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t(def.labelKey)}</h3>
            </div>
            <button
              onClick={() => onDelete(block.id)}
              className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
              title={t('editor.propsPanel.deleteBlock')}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {def.fields
              .filter((field) => !field.showIf || field.showIf(values))
              .map((field) =>
              field.type === 'colorGroup' ? (
                <ColorGroupField
                  key={field.key}
                  field={field}
                  values={values}
                  onChange={(key, newValue) => onUpdateProps(block.id, { [key]: newValue })}
                />
              ) : (
                <Field
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(newValue) => {
                    const patch = { [field.key]: newValue };
                    field.clearsFields?.forEach((key) => { patch[key] = null; });
                    onUpdateProps(block.id, patch);
                  }}
                />
              )
            )}
          </div>
        </>
      )}
    </MobileDrawer>
  );
}
