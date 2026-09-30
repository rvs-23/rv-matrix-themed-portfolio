// @ts-check
/**
 * @file js/legacyLinks.js
 * Old recruiter-mode links (`#recruiter`, `?mode=recruiter`) predate its
 * removal. The server never sees a hash and `_redirects` can't match a query,
 * so they're cleaned up here; the `/recruiter` path is handled in
 * `public/_redirects`.
 */

/**
 * The URL to show instead of `href`, or null if it carries no legacy marker.
 * Other params (e.g. `?cmd=`) survive.
 * @param {string} href
 * @returns {string|null}
 */
export function cleanLegacyUrl(href) {
  const url = new URL(href);
  const hasHash = url.hash === "#recruiter";
  const hasMode = url.searchParams.get("mode") === "recruiter";
  if (!hasHash && !hasMode) return null;
  if (hasHash) url.hash = "";
  if (hasMode) url.searchParams.delete("mode");
  return url.pathname + url.search + url.hash;
}
