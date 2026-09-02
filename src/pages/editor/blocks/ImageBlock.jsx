// `height` is a fixed px value set at the page's reference width — expressed
// here as a real aspect-ratio (referenceWidth : height) rather than applied
// as a raw height, so this preview matches store/BuilderPageRenderer.tsx's
// ImageBlockRenderer exactly. A raw fixed height stays the same regardless
// of how wide the box actually renders, while floating elements pinned on
// top are positioned by %, so any gap between this canvas's actual width and
// referenceWidth (a narrower panel, a different maxWidth) used to throw the
// two out of sync — the box's proportions, and everything positioned on it,
// now scale together the same way in both places.
export default function ImageBlock({ src, alt, caption, width, align, height, referenceWidth = 720 }) {
  const widthPct = width || 100;
  const justify = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center';
  const aspectRatio = height ? `${referenceWidth} / ${height}` : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: justify }}>
      {src ? (
        <div style={{ width: `${widthPct}%`, maxWidth: '100%', minWidth: 0, minHeight: 0, aspectRatio, overflow: 'hidden' }}>
          <img
            src={src}
            alt={alt || ''}
            style={{
              width: '100%',
              height: aspectRatio ? '100%' : 'auto',
              display: 'block',
              objectFit: aspectRatio ? 'cover' : undefined,
              // Shrinking the block crops from the bottom — the visible
              // portion stays anchored to the top of the image instead of
              // stretching/squishing it to fit.
              objectPosition: 'top',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: `${widthPct}%`,
            aspectRatio: '16 / 9',
            backgroundColor: 'var(--md-surface, #f4f4f5)',
            border: '1px dashed var(--md-border, #d4d4d8)',
          }}
        />
      )}
      {caption && (
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--md-text-muted, #71717a)', textAlign: align || 'center' }}>
          {caption}
        </p>
      )}
    </div>
  );
}
