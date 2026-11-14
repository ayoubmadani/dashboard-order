import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import ProviderLogo from './ProviderLogo';

export default function ProviderCard({ provider, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(provider)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/20'
          : 'border-gray-100 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
      }`}
    >
      <ProviderLogo logo={provider.logo} box="w-8 h-8 rounded-lg" iconClass="w-4 h-4" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{provider.title}</p>
        <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{provider.description?.slice(0, 40)}...</p>
      </div>
      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />}
    </button>
  );
}
