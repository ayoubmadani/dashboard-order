import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ImageIcon, X, Plus } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';
import ModelImages from '../../../components/ModelImages';

// Mirrors store/src/components/builderPages/BuilderPageRenderer.tsx's
// ProductImagesBlockRenderer for the *display* logic (same slider/vertical
// markup) — but unlike that read-only renderer, this side owns the actual
// image list: `images` is seeded once from the linked product's own photos
// the first time this block is added to a page (props.images is still
// undefined at that point), then becomes fully independent — merchants can
// add/remove/reorder from here on without touching the product's own
// photos, and the product changing later never resyncs it.
const arrowBtnStyle = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: 10,
  transform: 'translateY(-50%)',
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'rgba(255,255,255,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  color: '#18181b',
});

const moveBtnStyle = {
  width: 24,
  height: 24,
  border: 'none',
  borderRadius: 6,
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  color: '#18181b',
  padding: 0,
};

const deleteBtnStyle = {
  position: 'absolute',
  top: 8,
  left: 8,
  width: 24,
  height: 24,
  border: 'none',
  borderRadius: '50%',
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#ffffff',
  padding: 0,
  zIndex: 2,
  pointerEvents: 'auto',
};

export default function ProductImagesBlock({
  productId, layout, images, updateProps,
  borderRadius, showDots, showArrows, showThumbnails, backgroundColor, padding, borderColor, borderWidth, imageGap,
}) {
  const [index, setIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const seededFor = useRef(null);

  // One-time seed: a brand-new block has `images` still undefined (not just
  // empty — that's the "merchant deleted everything on purpose" state) and
  // needs a starting point. Guarded by `productId` too so switching the
  // page's product doesn't re-seed an already-independent list.
  useEffect(() => {
    if (images !== undefined || !productId || seededFor.current === productId) return;
    seededFor.current = productId;
    axios
      .get(`${baseURL}/builder-pages/product-info/${productId}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      .then((res) => updateProps?.({ images: Array.isArray(res.data?.images) ? res.data.images : [] }))
      .catch(() => updateProps?.({ images: [] }));
  }, [productId, images, updateProps]);

  const list = Array.isArray(images) ? images : [];
  // Clamped on render instead of reset via a synchronous setState in an
  // effect — index can otherwise point past the end for a moment right
  // after deleting the currently active image.
  const activeIndex = index < list.length ? index : 0;
  const radius = borderRadius ?? 12;

  const moveImage = (pos, dir) => {
    const target = pos + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[pos], next[target]] = [next[target], next[pos]];
    updateProps?.({ images: next });
  };
  const removeImage = (pos) => updateProps?.({ images: list.filter((_, i) => i !== pos) });
  const addImages = (imageData) => updateProps?.({ images: [...list, imageData.url] });

  const picker = (
    <ModelImages
      isOpen={pickerOpen}
      close={() => setPickerOpen(false)}
      onSelectImage={addImages}
      initialFolder="products"
      maxSelectable={20}
    />
  );

  if (list.length === 0) {
    return (
      <div style={{ backgroundColor: backgroundColor || undefined, padding: padding || undefined, pointerEvents: 'auto' }}>
        {picker}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            backgroundColor: 'var(--md-surface, #f4f4f5)',
            border: '1px dashed var(--md-border, #d4d4d8)',
            borderRadius: radius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          <ImageIcon size={24} style={{ color: 'rgba(148,163,184,0.9)' }} />
        </button>
      </div>
    );
  }

  const mainBorder = borderWidth ? `${borderWidth}px solid ${borderColor || '#000000'}` : undefined;
  const addTileStyle = {
    flexShrink: 0,
    width: 100,
    height: 100,
    borderRadius: 6,
    border: '1px dashed var(--md-border, #d4d4d8)',
    backgroundColor: 'var(--md-surface, #f4f4f5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(148,163,184,0.9)',
    pointerEvents: 'auto',
  };

  if (layout === 'vertical') {
    return (
      <div style={{ backgroundColor: backgroundColor || undefined, padding: padding || undefined, display: 'flex', flexDirection: 'column', gap: imageGap ?? 12, pointerEvents: 'auto' }}>
        {picker}
        {list.map((src, pos) => (
          <div key={pos} style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: radius, overflow: 'hidden', border: mainBorder, boxSizing: 'border-box' }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button type="button" onClick={() => removeImage(pos)} style={deleteBtnStyle}>
              <X size={14} />
            </button>
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'auto' }}>
              <button type="button" disabled={pos === 0} onClick={() => moveImage(pos, -1)} style={{ ...moveBtnStyle, opacity: pos === 0 ? 0.4 : 1, cursor: pos === 0 ? 'default' : 'pointer' }}>
                <ChevronUp size={14} />
              </button>
              <button type="button" disabled={pos === list.length - 1} onClick={() => moveImage(pos, 1)} style={{ ...moveBtnStyle, opacity: pos === list.length - 1 ? 0.4 : 1, cursor: pos === list.length - 1 ? 'default' : 'pointer' }}>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setPickerOpen(true)} style={{ ...addTileStyle, width: '100%', height: 60 }}>
          <Plus size={20} />
        </button>
      </div>
    );
  }

  const goTo = (i) => setIndex(((i % list.length) + list.length) % list.length);

  return (
    <div style={{ backgroundColor: backgroundColor || undefined, padding: padding || undefined, pointerEvents: 'auto' }}>
      {picker}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: radius, overflow: 'hidden', border: mainBorder, boxSizing: 'border-box' }}>
        <img src={list[activeIndex]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button type="button" onClick={() => removeImage(activeIndex)} style={deleteBtnStyle}>
          <X size={14} />
        </button>
        {showArrows !== false && list.length > 1 && (
          <>
            <button type="button" onClick={() => goTo(activeIndex - 1)} style={arrowBtnStyle('left')}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => goTo(activeIndex + 1)} style={arrowBtnStyle('right')}>
              <ChevronRight size={18} />
            </button>
          </>
        )}
        {showDots !== false && list.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                style={{
                  width: i === activeIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  transition: 'width 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>
      {/* The "+" tile always stays available even with thumbnails hidden —
          that toggle is about the published page's look, not about whether
          images can still be managed while editing. */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, overflowX: 'auto' }}>
        {showThumbnails !== false && list.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            style={{
              flexShrink: 0,
              width: 100,
              height: 100,
              padding: 0,
              borderRadius: 6,
              overflow: 'hidden',
              cursor: 'pointer',
              border: i === activeIndex ? `2px solid ${borderColor || 'var(--md-primary, #10b981)'}` : '2px solid transparent',
              opacity: i === activeIndex ? 1 : 0.7,
            }}
          >
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
        <button type="button" onClick={() => setPickerOpen(true)} style={addTileStyle}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
