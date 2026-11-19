// Name of an order line. Lines from a connected shop (WooCommerce…) store "Name (options)" in title and the options
// in external.options: show the name alone here — the options get their own line, so a long name never hides them.
export function lineName(item) {
  const title = item?.title || '';
  const options = item?.external?.options;
  const suffix = options ? ` (${options})` : '';
  return suffix && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}
