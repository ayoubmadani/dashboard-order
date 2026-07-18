// lucide-react has no WhatsApp brand icon — this is the standard WhatsApp
// glyph as an inline SVG, matching lucide's own icon component shape (a
// `size` prop, filled with currentColor so it inherits the button's
// configured icon color) so it drops straight into the same icon map as
// every lucide icon in floatingButtonIcons.jsx. Kept in its own file (not
// exported alongside the icon map's constants) so Fast Refresh sees a
// clean, single-component file.
export default function WhatsAppIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.17-3.12.82.83-3.04-.19-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.8c0 4.54-3.7 8.26-8.25 8.26Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.22-.08-.38-.12-.55.13-.17.25-.63.8-.77.97-.14.16-.28.18-.53.06-.25-.12-1.05-.39-2-1.24a7.5 7.5 0 0 1-1.38-1.74c-.14-.25-.02-.38.11-.5.11-.11.25-.28.36-.42.11-.14.15-.24.23-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.34-.75-1.83-.2-.48-.4-.41-.55-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.31-.22.25-.84.83-.84 2.02 0 1.19.86 2.35.98 2.51.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.5.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
