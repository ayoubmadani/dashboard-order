import { X } from 'lucide-react';

// Docked as a normal flex column on desktop (md: and up) regardless of
// `open` — that state only matters below md, where there isn't room to
// show Sidebar + Canvas + PropsPanel side by side at once (Sidebar alone
// is 256px, PropsPanel 288px — together already wider than most phone
// screens). There it renders as a full-screen overlay instead, opened via
// a toggle button in Topbar.jsx and closed here or by making a selection.
export default function MobileDrawer({ open, onClose, widthClass, borderClass, className = '', children }) {
  return (
    <aside
      className={`${open ? 'fixed inset-0 z-40 flex flex-col' : 'hidden'} md:flex md:relative md:inset-auto md:z-auto md:flex-col w-full ${widthClass} md:shrink-0 h-full overflow-y-auto ${borderClass} border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 ${className}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="md:hidden self-end mb-2 p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <X size={18} />
      </button>
      {children}
    </aside>
  );
}
