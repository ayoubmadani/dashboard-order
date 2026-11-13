// مصادر الطلبات (من أين جاء الزبون) — نفس قنوات الخادم + unknown (طلبات بلا مصدر)
const META = {
  facebook: { label: 'Facebook', short: 'FB', color: '#1877F2' },
  instagram: { label: 'Instagram', short: 'IG', color: '#E1306C' },
  tiktok: { label: 'TikTok', short: 'TT', color: '#111111' },
  google: { label: 'Google', short: 'G', color: '#EA4335' },
  youtube: { label: 'YouTube', short: 'YT', color: '#FF0000' },
  snapchat: { label: 'Snapchat', short: 'SC', color: '#E6C200' },
  whatsapp: { label: 'WhatsApp', short: 'WA', color: '#25D366' },
  bing: { label: 'Bing', short: 'B', color: '#008373' },
  twitter: { label: 'X', short: 'X', color: '#111111' },
  direct: { label: 'direct', short: '↗', color: '#64748B' },
  other: { label: 'other', short: '•', color: '#94A3B8' },
  unknown: { label: 'unknown', short: '?', color: '#CBD5E1' },
};
export const SOURCE_KEYS = Object.keys(META);
export const sourceMeta = (k) => ({ key: META[k] ? k : 'other', ...(META[k] ?? META.other) });
export const rate = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);
