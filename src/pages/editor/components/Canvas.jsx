import { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { componentsMap } from '../blocks/componentsMap';
import ElementsOverlay from '../blocks/ElementsOverlay';

const MIN_BLOCK_HEIGHT = 20;
// A sanity ceiling, not a real content limit — the actual bug that made
// this necessary (edge auto-scroll compounding a resize drag into the
// thousands of pixels) was fixed by removing auto-scroll from the height
// handle entirely (see BlockHeightHandle below). This just guards against
// a stray typo in the props panel's number field turning into an
// unreachable block, while staying well above any real content need (a
// long infographic image, a tall sticky bar, etc).
const MAX_BLOCK_HEIGHT = 8000;

// Drag-to-resize handle for blocks whose componentsMap entry sets
// `resizableHeight` (e.g. spacer, image) — an alternative to typing a
// number into the props panel, matching the resize-handle pattern already
// used for floating elements in ElementsOverlay.
function BlockHeightHandle({ height, measureRef, onResize, visible }) {
  const handlePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    // Blocks like image have no height until first resized (they render at
    // their natural aspect ratio) — fall back to the block's actual
    // rendered height so the first drag starts from where it visually is,
    // instead of jumping the instant you grab the handle.
    const startHeight = height || measureRef?.current?.getBoundingClientRect().height || MIN_BLOCK_HEIGHT;

    // No edge auto-scroll here (unlike the floating-element resize in
    // ElementsOverlay) — pairing auto-scroll with this delta-from-start-point
    // math let the block's own edge keep sliding away from the cursor as the
    // page scrolled, so holding near the canvas edge for even a moment made
    // the height run away far past what was actually dragged (reported: a
    // block growing to cover the whole canvas and blocking clicks/drops on
    // everything else). Resizing taller than the visible viewport now just
    // requires releasing, scrolling, and grabbing the handle again.
    const onMove = (moveEvent) => {
      const next = Math.round(startHeight + (moveEvent.clientY - startY));
      onResize(Math.min(MAX_BLOCK_HEIGHT, Math.max(MIN_BLOCK_HEIGHT, next)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-x-0 bottom-0 h-3 flex items-center justify-center cursor-ns-resize"
      style={{ touchAction: 'none' }}
    >
      <div
        className={`w-10 h-1.5 rounded-full bg-emerald-500 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
      />
    </div>
  );
}

function CanvasBlock({ block, index, isSelected, onSelect, onDelete, onDeleteAt, onDuplicate, onUpdateProps, selectedElementId, onSelectElement, pageProductId, referenceWidth }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block?.id ?? `unknown-${index}` });
  const def = block && componentsMap[block.type];
  const wrapperRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // A saved page can hold a corrupted or unrecognized entry — e.g. a block
  // type removed from componentsMap after the page was built, or (as seen
  // once in practice) a stray empty array where a block object should be,
  // which has no `id` at all. Render a deletable placeholder identified by
  // its array position (since `id` may be missing or, worse, shared by
  // multiple corrupted entries) instead of crashing the whole canvas.
  if (!def) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => block?.id && onSelect(block.id)}
        className={`group relative border-2 rounded-lg p-4 text-center text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 cursor-pointer ${
          isSelected ? 'border-emerald-500' : 'border-rose-200 dark:border-rose-500/30'
        } ${isDragging ? 'opacity-50 z-10' : ''}`}
      >
        {`Unknown block type: ${block?.type}`}
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteAt(index); }}
          className="absolute top-2 end-2 p-1.5 rounded-md bg-white dark:bg-zinc-900 shadow border border-gray-200 dark:border-zinc-700 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  const Component = def.Component;
  const elements = block.props.elements ?? def.defaultProps.elements;
  const rawHeight = block.props.height ?? def.defaultProps.height;
  // Clamp on read too, not just on new drags/typed input — a block already
  // saved with a runaway height (from the since-fixed resize bug) would
  // otherwise keep covering the whole canvas forever on every future load.
  const currentHeight = rawHeight ? Math.min(MAX_BLOCK_HEIGHT, rawHeight) : rawHeight;

  // A spacer pinned top/bottom is meant to render position:fixed on the
  // real published page (see SpacerBlock.jsx) — but rendering that for
  // real *inside the editor* was tried three times (escaped past the
  // canvas into the sidebar, collapsed its own slot to unselectable, then
  // hid its own floating elements) and broke something new each time. The
  // editor now always shows it as a normal in-flow block — fully visible,
  // selectable, and editable, elements included — with just a small badge
  // noting it'll be pinned once published. The stored `position` value
  // itself is untouched, so publish() (which reads it directly from the
  // saved tree, not through this component) still renders it truly fixed.
  const isPinned = block.type === 'spacer' && (block.props.position === 'top' || block.props.position === 'bottom');
  const pinnedLabelKey = block.props?.position === 'top' ? 'editor.fields.positionOptions.top' : 'editor.fields.positionOptions.bottom';

  // productForm no longer has its own product picker (see componentsMap) —
  // it always uses the product chosen for the whole page at creation time.
  // Falls back to a legacy block-level productId for pages built before
  // that page-level field existed.
  const componentProps =
    block.type === 'productForm'
      ? { ...def.defaultProps, ...block.props, productId: pageProductId || block.props.productId }
      : isPinned
      ? { ...def.defaultProps, ...block.props, height: currentHeight, position: 'static' }
      : def.resizableHeight
      ? { ...def.defaultProps, ...block.props, height: currentHeight, referenceWidth }
      : { ...def.defaultProps, ...block.props };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(block.id)}
      className={`group relative border-2 rounded-lg transition-colors cursor-pointer ${
        isSelected ? 'border-emerald-500' : 'border-transparent hover:border-emerald-500/30'
      } ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      {isPinned && (
        <div className="absolute top-1.5 start-1.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white pointer-events-none">
          {t(pinnedLabelKey)}
        </div>
      )}
      <div ref={wrapperRef} style={{ position: 'relative', containerType: 'inline-size' }}>
        <div className="pointer-events-none">
          <Component {...componentProps} />
        </div>
        <ElementsOverlay
          elements={elements}
          editable={isSelected}
          onElementsChange={(next) => onUpdateProps(block.id, { elements: next })}
          activeElementId={isSelected ? selectedElementId : null}
          onActiveElementChange={(elementId) => onSelectElement(block.id, elementId)}
          blockHeight={currentHeight}
          onGrowBlockHeight={(minHeight) => onUpdateProps(block.id, { height: Math.max(currentHeight ?? 0, minHeight) })}
          referenceWidth={referenceWidth}
        />
        {def.resizableHeight && !block.props.locked && (
          <BlockHeightHandle
            height={currentHeight}
            measureRef={wrapperRef}
            onResize={(next) => onUpdateProps(block.id, { height: next })}
            visible={isSelected}
          />
        )}
      </div>

      <div className="absolute top-2 end-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md bg-white dark:bg-zinc-900 shadow border border-gray-200 dark:border-zinc-700 cursor-grab active:cursor-grabbing text-gray-500"
        >
          <GripVertical size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
          className="p-1.5 rounded-md bg-white dark:bg-zinc-900 shadow border border-gray-200 dark:border-zinc-700 text-amber-500"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          className="p-1.5 rounded-md bg-white dark:bg-zinc-900 shadow border border-gray-200 dark:border-zinc-700 text-rose-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Canvas({ blocks, selectedId, onSelect, onDelete, onDeleteAt, onDuplicate, onUpdateProps, selectedElementId, onSelectElement, pageProductId, settings }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-dropzone' });

  // Page-wide settings (background/max width/padding) apply once to the
  // whole block stack here, instead of every block managing its own
  // container styling — falls back to the existing Tailwind defaults
  // (white card, 1024px, no padding) when a merchant hasn't customized them.
  const pagePadding = settings?.padding || 0;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 h-full overflow-y-auto bg-gray-100 dark:bg-black/20 p-6 transition-colors ${isOver ? 'bg-emerald-50 dark:bg-emerald-500/5' : ''}`}
    >
      {/* overflow-hidden here is the work box's own boundary — nothing
          rendered inside (any block's own content) can visually spill past
          the page card's rounded edges. */}
      <div
        className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden min-h-[400px]"
        style={{
          backgroundColor: settings?.backgroundColor || undefined,
          maxWidth: `${settings?.maxWidth || 720}px`,
          padding: pagePadding || undefined,
        }}
      >
        {blocks.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400 mb-1">{t('editor.canvas.emptyTitle')}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-600">{t('editor.canvas.emptySubtitle')}</p>
          </div>
        ) : (
          <SortableContext items={blocks.map((b, i) => b?.id ?? `unknown-${i}`)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <CanvasBlock
                key={block?.id ?? `unknown-${index}`}
                block={block}
                index={index}
                isSelected={block?.id != null && selectedId === block.id}
                onSelect={onSelect}
                onDelete={onDelete}
                onDeleteAt={onDeleteAt}
                onDuplicate={onDuplicate}
                onUpdateProps={onUpdateProps}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
                pageProductId={pageProductId}
                referenceWidth={settings?.maxWidth || 720}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
