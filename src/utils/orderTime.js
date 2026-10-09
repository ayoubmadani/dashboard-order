// أدوات عرض وقت الطلب: "منذ 3 ساعات" + التاريخ الكامل، حسب لغة الواجهة

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

const locale = (lang) => (lang?.startsWith('ar') ? 'ar-DZ' : lang?.startsWith('fr') ? 'fr-FR' : 'en-US');

/** "منذ 5 دقائق" / "5 minutes ago" / "il y a 5 minutes" */
export function timeAgo(date, lang) {
  if (!date) return '';
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit);
  }
  return rtf.format(0, 'minute'); // "الآن" / "now"
}

/** التاريخ والوقت كاملين، مثل: 8 أكتوبر 2026، 17:15 */
export function formatOrderDate(date, lang) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale(lang), {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}
