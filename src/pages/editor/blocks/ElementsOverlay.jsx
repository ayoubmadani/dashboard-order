import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { startEdgeAutoScroll } from './autoScroll';

const MIN_SIZE = 40;
const MIN_WIDTH_PERCENT = 5;

// When the aspect-ratio lock is switched on, snap the box to the image's
// real (natural) proportions at its current width — that's what makes the
// full photo visible instead of the object-fit:cover crop that was hiding
// part of it under whatever height happened to be set before locking.
function ImageElementNode({ el, style, resizeHandle, onPointerDown, containerRef, updateElement }) {
  const imgRef = useRef(null);

  useEffect(() => {
    if (!el.lockAspectRatio || !el.src) return undefined;

    const snapToNaturalRatio = () => {
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container || !img.naturalWidth || !img.naturalHeight) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const currentWidthPercent = el.width || 40;
      const currentWidthPx = (currentWidthPercent / 100) * rect.width;
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const oldHeight = el.height || 160;
      const newHeight = Math.max(MIN_SIZE / 2, currentWidthPx / naturalRatio);
      // The box is centered on its y anchor (translate(-50%, -50%)), so
      // changing height alone would grow it symmetrically from the middle.
      // Shift the anchor by half the size change to keep the top edge fixed
      // instead, matching how every other resize in this file behaves.
      const deltaYPercent = rect.height > 0 ? (((newHeight - oldHeight) / 2) / rect.height) * 100 : 0;
      const newY = Math.min(100, Math.max(0, (el.y ?? 50) + deltaYPercent));
      updateElement(el.id, { height: newHeight, y: newY });
    };

    const img = imgRef.current;
    if (img?.complete) {
      snapToNaturalRatio();
      return undefined;
    }
    img?.addEventListener('load', snapToNaturalRatio, { once: true });
    return () => img?.removeEventListener('load', snapToNaturalRatio);
    // Only re-snap when the lock is (re-)enabled or the image itself
    // changes — not on every width/height change, which would fight the
    // user's own drag-resize once the lock is already on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.lockAspectRatio, el.src]);

  return (
    <div onPointerDown={onPointerDown} onClick={(e) => e.stopPropagation()} style={style}>
      {el.src ? (
        <img
          ref={imgRef}
          src={el.src}
          alt={el.alt || ''}
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
        />
      ) : (
        <ImageIcon size={20} style={{ color: 'rgba(148,163,184,0.9)', pointerEvents: 'none' }} />
      )}
      {resizeHandle}
    </div>
  );
}

// Canva-style floating text/button elements, positioned by x/y percentage,
// draggable to any spot, resizable via a corner handle. Composed as an
// absolutely-positioned overlay on top of ANY block's own rendered content
// (see Canvas.jsx) — not tied to one specific block type. Clicking an
// element always selects it (even before its parent block is the active
// selection — the click bubbles up to select the block too), but `editable`
// still gates drag/resize/inline-edit — off by default so the overlay
// renders inert/static for a future read-only storefront view.
// `activeElementId`/`onActiveElementChange` are controlled from PageEditor
// so clicking an element on the canvas also promotes its fields to the top
// of PropsPanel, not just this overlay's own outline/resize-handle.
export default function ElementsOverlay({
  elements,
  editable,
  onElementsChange,
  activeElementId,
  onActiveElementChange,
  blockHeight,
  onGrowBlockHeight,
  referenceWidth = 720,
}) {
  const containerRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const activeId = activeElementId ?? null;
  const setActiveId = (id) => onActiveElementChange?.(id);

  const items = useMemo(() => (Array.isArray(elements) ? elements : []), [elements]);

  const updateElement = useCallback(
    (id, patch) => {
      const nextElements = items.map((el) => (el.id === id ? { ...el, ...patch } : el));
      onElementsChange?.(nextElements);

      // Only blocks with their own adjustable height (canvasSection, spacer)
      // pass a numeric blockHeight — for everything else this is a no-op.
      // Whenever an element's height/position changes, grow the block to
      // keep containing it instead of letting it spill past the bottom.
      // PageEditor's handleUpdateProps is the single place that rescales
      // every element's y in response — it catches *any* cause of the
      // block's height changing, not just this one.
      if (blockHeight != null && (patch.height != null || patch.y != null)) {
        const updated = nextElements.find((item) => item.id === id);
        if (updated) {
          const bottomPx = ((updated.y ?? 50) / 100) * blockHeight + (updated.height ?? 0) / 2;
          if (bottomPx > blockHeight) onGrowBlockHeight?.(Math.ceil(bottomPx));
        }
      }
    },
    [items, onElementsChange, blockHeight, onGrowBlockHeight]
  );

  if (!editable && items.length === 0) return null;

  const handlePointerDown = (e, id) => {
    if (editingId) return;
    // Report the click even before this block is the active selection: a
    // click on a text/button element should select the element and its
    // parent block together in one action (the click still bubbles to the
    // block's own onClick since we haven't stopped propagation yet), rather
    // than requiring a first click to select the block and a second to
    // drill into the element.
    setActiveId(id);
    if (!editable) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);

    const container = containerRef.current;
    if (!container) return;

    // Elements position by their center (translate(-50%, -50%)), so without
    // this offset the center would snap straight to wherever the pointer
    // happens to be the instant you grab the element — a jarring jump on
    // every drag unless you happened to grab exactly at its center. Instead,
    // capture the offset between the pointer and the element's current
    // center on pointerdown, and keep applying that same offset for the
    // whole drag so the element moves smoothly with the cursor.
    const el = items.find((item) => item.id === id);
    const startRect = container.getBoundingClientRect();
    const startPointerX = ((e.clientX - startRect.left) / startRect.width) * 100;
    const startPointerY = ((e.clientY - startRect.top) / startRect.height) * 100;
    const offsetX = (el?.x ?? 50) - startPointerX;
    const offsetY = (el?.y ?? 50) - startPointerY;

    const onMove = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      const pointerX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      const x = Math.min(100, Math.max(0, pointerX + offsetX));
      const y = Math.min(100, Math.max(0, pointerY + offsetY));
      updateElement(id, { x, y });
    };
    const onUp = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // mode: 'both' (corner handle) resizes width+height together; 'width'
  // (right-edge handle) and 'height' (bottom-edge handle) resize a single
  // axis only.
  const handleResizeStart = (e, el, mode = 'both') => {
    if (!editable) return;
    e.stopPropagation();
    e.preventDefault();
    setResizingId(el.id);

    const container = containerRef.current;
    const containerRect = container ? container.getBoundingClientRect() : null;
    const containerWidth = containerRect ? containerRect.width : 0;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidthPercent = el.width || (el.type === 'text' ? 60 : 40);
    const startHeight = el.height || (el.type === 'text' ? 100 : el.type === 'image' ? 160 : 44);
    const startPosX = el.x ?? 50;
    const startPosY = el.y ?? 50;

    // Resizing height near the top/bottom edge of the scrollable canvas
    // should keep scrolling so the handle stays reachable, instead of
    // leaving an unreachable gap once you drag past the visible viewport.
    const scrollContainer = container ? container.closest('.overflow-y-auto') : null;
    const autoScroll = mode !== 'width' ? startEdgeAutoScroll(scrollContainer) : null;

    // Aspect-ratio lock only applies to images. When on, whichever axis the
    // user actually drags drives the size, and the other axis is derived
    // from the ratio captured at drag-start — so the image never stretches
    // out of proportion regardless of which handle was grabbed.
    const startWidthPx = (startWidthPercent / 100) * containerWidth;
    const lockRatio = el.type === 'image' && el.lockAspectRatio && startHeight > 0 && containerWidth > 0;
    const ratio = lockRatio ? startWidthPx / startHeight : null;

    const applyWidth = (patch, newWidth) => {
      patch.width = newWidth;
      // The element is centered on its x/y anchor (translate(-50%, -50%)),
      // so growing the width alone would expand it symmetrically from the
      // center. Shift the anchor by half the size change to keep the edge
      // opposite the handle (left, here) fixed in place instead.
      patch.x = Math.min(100, Math.max(0, startPosX + (newWidth - startWidthPercent) / 2));
    };
    // Takes the CURRENT container height, re-measured on every move rather
    // than cached once at drag-start: if this same drag has already grown
    // the block (see updateElement's auto-grow below), the container is
    // taller now than it was when the drag began, and computing the
    // top-anchor offset against the stale height would drift the top edge
    // instead of holding it fixed.
    const applyHeight = (patch, newHeight, liveContainerHeight) => {
      patch.height = newHeight;
      const deltaYPercent = liveContainerHeight > 0 ? (((newHeight - startHeight) / 2) / liveContainerHeight) * 100 : 0;
      patch.y = Math.min(100, Math.max(0, startPosY + deltaYPercent));
    };

    const onMove = (moveEvent) => {
      autoScroll?.updateY(moveEvent.clientY);
      const liveContainerHeight = container ? container.getBoundingClientRect().height : 0;
      const patch = {};

      if (ratio) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        // For the corner handle (mode 'both'), driving off horizontal
        // movement alone made the resize feel dead when someone dragged
        // mostly vertically — follow whichever axis the pointer actually
        // moved more on instead.
        const driveByHeight = mode === 'height' || (mode === 'both' && Math.abs(dy) > Math.abs(dx));

        if (driveByHeight) {
          const newHeight = Math.max(MIN_SIZE / 2, startHeight + dy);
          const widthPx = newHeight * ratio;
          applyWidth(patch, containerWidth > 0 ? Math.min(100, Math.max(MIN_WIDTH_PERCENT, (widthPx / containerWidth) * 100)) : startWidthPercent);
          applyHeight(patch, newHeight, liveContainerHeight);
        } else {
          const deltaPercent = containerWidth > 0 ? (dx / containerWidth) * 100 : 0;
          const newWidth = Math.min(100, Math.max(MIN_WIDTH_PERCENT, startWidthPercent + deltaPercent));
          const widthPx = (newWidth / 100) * containerWidth;
          applyWidth(patch, newWidth);
          applyHeight(patch, Math.max(MIN_SIZE / 2, widthPx / ratio), liveContainerHeight);
        }
        updateElement(el.id, patch);
        return;
      }

      if (mode !== 'height') {
        // Width is a percentage of the block it's placed in — never let it
        // exceed 100%, so a floating element can't be resized wider than its
        // own container.
        const deltaPercent = containerWidth > 0 ? ((moveEvent.clientX - startX) / containerWidth) * 100 : 0;
        applyWidth(patch, Math.min(100, Math.max(MIN_WIDTH_PERCENT, startWidthPercent + deltaPercent)));
      }
      if (mode !== 'width') {
        // 1:1 with the pointer — a multiplier here would grow the bottom
        // edge faster than the cursor moves, throwing off the auto-scroll
        // edge check below (which tracks the raw pointer position) and
        // making the box run off-screen before scrolling kicks in.
        applyHeight(patch, Math.max(MIN_SIZE / 2, startHeight + (moveEvent.clientY - startY)), liveContainerHeight);
      }
      updateElement(el.id, patch);
    };
    const onUp = () => {
      setResizingId(null);
      autoScroll?.stop();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        // Clicks on an element bubble up to this container too — only clear
        // the selection when the click landed on the empty background
        // itself, not when it's bubbling up from a child element (which
        // would otherwise immediately undo the selection that element's own
        // pointerdown handler just set).
        if (editable && e.target === e.currentTarget) setActiveId(null);
      }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: items.length > 0 ? 'auto' : 'none',
      }}
    >
      {items.map((el) => {
        const isDragging = draggingId === el.id;
        const isResizing = resizingId === el.id;
        const isEditing = editingId === el.id;
        const isActive = editable && activeId === el.id;
        const width = el.width ? Math.min(100, el.width) : el.type === 'text' ? 60 : el.type === 'image' ? 40 : undefined;
        const boxHeight = el.height || (el.type === 'image' ? 160 : undefined);

        const commonStyle = {
          position: 'absolute',
          left: `${el.x ?? 50}%`,
          top: `${el.y ?? 50}%`,
          transform: 'translate(-50%, -50%)',
          cursor: isDragging ? 'grabbing' : 'pointer',
          userSelect: editable ? 'none' : 'auto',
          touchAction: 'none',
          outline: editable && (isDragging || isActive || isResizing) ? '1px dashed var(--md-primary, #10b981)' : 'none',
          padding: editable ? 4 : 0,
          pointerEvents: 'auto',
          width: width ? `${width}%` : undefined,
          height: boxHeight ? `${boxHeight}px` : undefined,
        };

        const resizeHandle = isActive && !isEditing && (
          <>
            <span
              onPointerDown={(e) => handleResizeStart(e, el, 'width')}
              title="Resize width"
              style={{
                position: 'absolute',
                top: '50%',
                right: -3,
                transform: 'translateY(-50%)',
                width: 8,
                height: 18,
                borderRadius: 3,
                backgroundColor: 'var(--md-primary, #10b981)',
                border: '2px solid #ffffff',
                cursor: 'ew-resize',
                zIndex: 2,
              }}
            />
            <span
              onPointerDown={(e) => handleResizeStart(e, el, 'height')}
              title="Resize height"
              style={{
                position: 'absolute',
                bottom: -3,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 18,
                height: 8,
                borderRadius: 3,
                backgroundColor: 'var(--md-primary, #10b981)',
                border: '2px solid #ffffff',
                cursor: 'ns-resize',
                zIndex: 2,
              }}
            />
            <span
              onPointerDown={(e) => handleResizeStart(e, el, 'both')}
              title="Resize"
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: 'var(--md-primary, #10b981)',
                border: '2px solid #ffffff',
                cursor: 'nwse-resize',
                zIndex: 3,
              }}
            />
          </>
        );

        if (el.type === 'button') {
          return (
            <a
              key={el.id}
              href={editable ? undefined : el.linkType === 'form' ? '#md-product-form' : el.link || '#'}
              onPointerDown={(e) => handlePointerDown(e, el.id)}
              onClick={(e) => {
                // Never actually navigate from inside the editor canvas —
                // this component only renders here today; `editable=false`
                // just means "not yet selected," not "live storefront."
                e.preventDefault();
                e.stopPropagation();
                // Scrolling to the order form is a safe, in-page action (no
                // real navigation), so it's worth previewing live even
                // while editing, unlike an external link.
                if (el.linkType === 'form') {
                  document.getElementById('md-product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              style={{
                ...commonStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: width ? 0 : '10px 24px',
                borderRadius: 8,
                backgroundColor: el.backgroundColor || 'var(--md-primary, #10b981)',
                color: el.textColor || '#ffffff',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: width ? 'normal' : 'nowrap',
              }}
            >
              {el.text}
              {resizeHandle}
            </a>
          );
        }

        if (el.type === 'image') {
          return (
            <ImageElementNode
              key={el.id}
              el={el}
              style={{
                ...commonStyle,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: el.src ? undefined : 'rgba(148,163,184,0.15)',
                display: el.src ? undefined : 'flex',
                alignItems: el.src ? undefined : 'center',
                justifyContent: el.src ? undefined : 'center',
                border: el.src ? undefined : '1px dashed rgba(148,163,184,0.6)',
              }}
              resizeHandle={resizeHandle}
              onPointerDown={(e) => handlePointerDown(e, el.id)}
              containerRef={containerRef}
              updateElement={updateElement}
            />
          );
        }

        // text element
        // Mirrors store/BuilderPageRenderer.tsx's FloatingElements exactly —
        // a fixed px fontSize only looks right at the width it was set at
        // (referenceWidth, the page's own maxWidth); clamping it to a cqw
        // value scaled from that reference keeps this block's own preview
        // in sync with how it'll actually shrink on a real phone screen,
        // instead of only ever showing the fixed-width desktop look.
        const basePx = el.fontSize || 24;
        return (
          <div
            key={el.id}
            onPointerDown={(e) => handlePointerDown(e, el.id)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              if (!editable) return;
              e.stopPropagation();
              setEditingId(el.id);
            }}
            style={{
              ...commonStyle,
              fontSize: `clamp(10px, ${(basePx / referenceWidth) * 100}cqw, ${basePx}px)`,
              fontWeight: el.fontWeight || 700,
              fontStyle: el.fontStyle || 'normal',
              textDecoration: el.textDecoration || 'none',
              color: el.color || '#ffffff',
              textAlign: 'center',
              lineHeight: 1.3,
              overflow: boxHeight ? 'hidden' : 'visible',
            }}
          >
            {isEditing ? (
              <input
                autoFocus
                value={el.content}
                onChange={(e) => updateElement(el.id, { content: e.target.value })}
                onBlur={() => setEditingId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  font: 'inherit',
                  color: 'inherit',
                  textAlign: 'inherit',
                  textDecoration: 'inherit',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 4,
                  padding: 2,
                  width: '100%',
                }}
              />
            ) : (
              el.content
            )}
            {resizeHandle}
          </div>
        );
      })}
    </div>
  );
}
