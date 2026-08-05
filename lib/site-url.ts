/**
 * The site's own absolute base URL.
 *
 * Needed because an email cannot contain a relative link. Everywhere else in the
 * app relative paths are correct and preferred, so this exists for that one
 * reason.
 *
 * Resolution order:
 *
 * 1. `SITE_URL`, when set. The only one that is right for a custom domain.
 * 2. `VERCEL_URL`, which Vercel injects per deployment, without a scheme.
 * 3. localhost, so development works with nothing configured.
 *
 * Set `SITE_URL` in production. Falling through to `VERCEL_URL` gives a working
 * but ugly per-deployment hostname in the customer's inbox.
 */
export function siteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();

  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_URL?.trim();

  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return "http://localhost:3000";
}

/** An absolute URL for a path like `/orders/abc`. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
