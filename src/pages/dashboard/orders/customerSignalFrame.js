// أصناف Tailwind كاملة (لا تُركَّب) حتى يجدها JIT
export const FRAME = {
  risk: 'outline outline-2 -outline-offset-2 outline-rose-500 rounded-xl',
  dup_open: 'outline outline-2 -outline-offset-2 outline-orange-400 rounded-xl',
  dup_progress: 'outline outline-2 -outline-offset-2 outline-violet-400 rounded-xl',
  caution: 'outline outline-2 -outline-offset-2 outline-amber-300 rounded-xl',
  trusted: 'outline outline-2 -outline-offset-2 outline-emerald-400 rounded-xl',
  previous: 'outline outline-2 -outline-offset-2 outline-gray-300 dark:outline-zinc-600 rounded-xl',
  new: 'outline outline-1 -outline-offset-1 outline-sky-300 dark:outline-sky-500/50 rounded-xl',
};
/** أصناف إطار سطر الطلب ('' بلا تنبيه) */
export const signalFrame = (s) => (s?.level ? FRAME[s.level] || '' : '');

