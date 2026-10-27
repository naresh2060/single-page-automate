const TRACKING_PARAM_PATTERN = /^(utm_|mtm_|itm_)/i;
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'ref_src',
  'ref_url',
  'ncid',
  'ocid',
  'yclid'
]);

export const normalizeArticleUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Article URL is required');
  }

  const parsed = new URL(rawUrl.trim());
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();

  const kept = [...parsed.searchParams.entries()]
    .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()) && !TRACKING_PARAM_PATTERN.test(key))
    .sort(([a], [b]) => a.localeCompare(b));

  parsed.search = '';
  for (const [key, value] of kept) {
    parsed.searchParams.append(key, value);
  }

  let href = parsed.toString();
  if (href.endsWith('/') && parsed.pathname !== '/') {
    href = href.slice(0, -1);
  }

  return href;
};
