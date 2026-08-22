import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function CredentialField({ label, fieldKey, value, onChange, isPassword }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && !visible ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={`Enter ${label}`}
          dir="ltr"
          className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 pr-10 text-sm font-medium text-gray-700 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
