// How the chosen options of an order line look — like MD Store's own variants:
// colour → a dot in that colour, image → a small picture, text → a chip.
// Lines from a connected shop (WooCommerce…) carry them in item.external.variant; older lines only have
// the text item.external.options, shown as is.
export default function VariantChips({ item, size = 'sm' }) {
  const entries = Array.isArray(item?.external?.variant) ? item.external.variant : [];
  const text = item?.external?.options;
  if (!entries.length && !text) return null;
  const small = size === 'xs';

  if (!entries.length) {
    return <span className={`block mt-1 ${small ? 'text-[11px]' : 'text-xs'} font-semibold text-indigo-600 dark:text-indigo-400`}>{text}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5 mt-1">
      {entries.map((e, i) => (
        <span key={i} className={`inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'} font-semibold text-gray-700 dark:text-zinc-200`}>
          <span className="text-gray-400 dark:text-zinc-500">{e.attrName}:</span>
          {e.displayMode === 'color' && e.color && (
            <span className="inline-block w-3 h-3 rounded-full ring-1 ring-black/15" style={{ background: e.color }} />
          )}
          {e.displayMode === 'image' && e.image && (
            <img src={e.image} alt="" className="w-4 h-4 rounded object-cover ring-1 ring-black/10" />
          )}
          <span>{e.value}</span>
        </span>
      ))}
    </span>
  );
}
