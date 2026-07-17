export default function ImageBlock({ src, alt, caption, width, align, height }) {
  const widthPct = width || 100;
  const justify = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: justify }}>
      {src ? (
        <div style={{ width: `${widthPct}%`, maxWidth: '100%', height: height || undefined, overflow: 'hidden', borderRadius: 12 }}>
          <img
            src={src}
            alt={alt || ''}
            style={{
              width: '100%',
              height: height ? '100%' : 'auto',
              display: 'block',
              objectFit: height ? 'cover' : undefined,
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
            borderRadius: 12,
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
