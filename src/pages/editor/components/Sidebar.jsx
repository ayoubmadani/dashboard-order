import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Lock, Type, MousePointerClick, Image as ImageIcon } from 'lucide-react';
import { componentsMap, blockTypes } from '../blocks/componentsMap';

function ElementPaletteItem({ elementType, icon, label }) {
  const Icon = icon;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `element-palette-${elementType}`,
    data: { source: 'element-palette', elementType },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-all text-start hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-gray-500 dark:text-zinc-400" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</span>
    </button>
  );
}

function PaletteItem({ blockType, disabled }) {
  const { t } = useTranslation();
  const def = componentsMap[blockType];
  const Icon = def.icon;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${blockType}`,
    data: { source: 'palette', blockType },
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      title={disabled ? t('editor.sidebar.alreadyOnPage') : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all text-start ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : `hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40' : ''}`
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        {disabled ? <Lock size={14} className="text-gray-400 dark:text-zinc-500" /> : <Icon size={16} className="text-gray-500 dark:text-zinc-400" />}
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{t(def.labelKey)}</span>
    </button>
  );
}

export default function Sidebar({ blocks }) {
  const { t } = useTranslation();
  const placedTypes = new Set((blocks || []).map((b) => b.type));

  return (
    <aside className="w-64 shrink-0 h-full overflow-y-auto border-e border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 p-3">
      {/* "Generate with AI" trigger hidden for now — onOpenGenerate/GenerateModal
          are untouched, just not linked to any visible UI, so this is a
          one-line revert (re-add the button below) when it comes back. */}

      <div className="px-1 mb-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('editor.sidebar.title')}</h2>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">{t('editor.sidebar.dragHint')}</p>
      </div>
      <div className="space-y-2 mb-5">
        {blockTypes.map((blockType) => (
          <PaletteItem
            key={blockType}
            blockType={blockType}
            disabled={componentsMap[blockType].singleton && placedTypes.has(blockType)}
          />
        ))}
      </div>

      <div className="px-1 mb-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('editor.sidebar.elementsTitle')}</h2>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">{t('editor.sidebar.elementsDragHint')}</p>
      </div>
      <div className="space-y-2">
        <ElementPaletteItem elementType="text" icon={Type} label={t('editor.canvasSection.addText')} />
        <ElementPaletteItem elementType="button" icon={MousePointerClick} label={t('editor.canvasSection.addButton')} />
        <ElementPaletteItem elementType="image" icon={ImageIcon} label={t('editor.canvasSection.addImage')} />
      </div>
    </aside>
  );
}
