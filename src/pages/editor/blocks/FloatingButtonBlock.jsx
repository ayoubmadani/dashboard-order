import { useTranslation } from 'react-i18next';
import { Pin } from 'lucide-react';
import { FLOATING_BUTTON_ICONS } from './floatingButtonIcons';

// Page-wide floating action button (e.g. a WhatsApp/call button) — wherever
// this block sits in the page's block list, the published page always
// renders it as a real position:fixed anchor pinned to a viewport corner
// (see store/BuilderPageRenderer.tsx's FloatingActionButton). Rendering it
// truly fixed *inside the editor* would either escape the canvas over the
// whole dashboard UI or need the same containing-block workaround tried and
// reverted for the page-settings version of this feature — simpler and
// consistent with how SpacerBlock.jsx's own pinned mode is previewed: show
// it as a normal, fully visible in-flow preview of what the button looks
// like, with a small badge noting where it'll actually stick once published.
export default function FloatingButtonBlock({ position, contentType, text, icon, width, height, backgroundColor, textColor }) {
  const { t } = useTranslation();
  const isText = (contentType || 'icon') === 'text';
  const Icon = FLOATING_BUTTON_ICONS[icon] || FLOATING_BUTTON_ICONS.MessageCircle;
  const w = width || 56;
  const h = height || 56;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: isText ? undefined : w,
          height: h,
          minWidth: isText ? w : undefined,
          padding: isText ? '0 16px' : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: isText ? 12 : '50%',
          backgroundColor: backgroundColor || '#10b981',
          color: textColor || '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {isText ? text : <Icon size={Math.round(Math.min(w, h) * 0.45)} />}
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--md-text-muted, #71717a)',
          backgroundColor: 'var(--md-surface, #f4f4f5)',
          border: '1px solid var(--md-border, #d4d4d8)',
        }}
      >
        <Pin size={11} />
        {t(`editor.fields.floatingPositionOptions.${position || 'bottom-right'}`)}
      </span>
    </div>
  );
}
