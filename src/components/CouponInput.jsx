import React from 'react';
import { Tag, Loader2, CheckCircle2, X } from 'lucide-react';

/**
 * Shared coupon-code input used in the plan-purchase and theme-install flows.
 * Purely presentational/controlled — the parent owns the code/checking/appliedText/error state
 * and does the actual POST /coupons/validate call.
 */
export default function CouponInput({
  code,
  onCodeChange,
  onApply,
  onClear,
  checking = false,
  appliedText,
  error,
  placeholder,
  applyLabel,
  disabled = false,
}) {
  if (appliedText) {
    return (
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={15} />
          {appliedText}
        </div>
        {onClear && (
          <button type="button" onClick={onClear} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300">
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApply(); } }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full ps-9 pe-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-wide placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white disabled:opacity-50 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={checking || disabled || !code?.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shrink-0"
        >
          {checking && <Loader2 size={13} className="animate-spin" />}
          {applyLabel}
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-semibold mt-1.5 px-1">{error}</p>}
    </div>
  );
}
