/**
 * صفحة «الإضافات»: بطاقة لكل شركة توصيل (بترتيب قائمة الشركات)، مع حسابات المتجر المربوطة بها.
 * filter: 'all' | 'connected'. البحث في الاسم الظاهر والاسم الداخلي.
 */
export function pluginCards(providers, accounts, { query = '', filter = 'all' } = {}) {
  const byProvider = new Map();
  for (const a of accounts ?? []) {
    if (!byProvider.has(a.providerName)) byProvider.set(a.providerName, []);
    byProvider.get(a.providerName).push(a);
  }
  const q = query.trim().toLowerCase();
  return (providers ?? [])
    .map((provider) => {
      const linked = byProvider.get(provider.name) ?? [];
      return { provider, accounts: linked, connected: linked.length > 0 };
    })
    .filter((c) => filter !== 'connected' || c.connected)
    .filter((c) => !q || `${c.provider.title ?? ''} ${c.provider.name}`.toLowerCase().includes(q));
}
