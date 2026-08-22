import React from 'react';
import { Link } from 'react-router-dom';

export default function SidebarNav({ tabs, activeTab }) {
  return (
    <aside className="lg:w-64 space-y-2">
      {tabs.map((tabItem) => (
        <Link
          key={tabItem.id}
          to={`/dashboard/settings/${tabItem.id}`}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tabItem.id
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl'
            : 'bg-white dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
        >
          {tabItem.icon}{tabItem.label}
        </Link>
      ))}
    </aside>
  );
}
