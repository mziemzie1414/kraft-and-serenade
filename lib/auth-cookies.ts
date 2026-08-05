/**
 * Cookie names only.
 *
 * Kept in its own module with no imports so `proxy.ts` can use it. Pulling these
 * from `lib/auth.ts` would drag Prisma and `node:crypto` into the proxy bundle,
 * which does not run in that environment.
 */
export const ADMIN_COOKIE = "admin_session";

/**
 * The storefront customer session. Separate from the admin cookie on purpose:
 * signing in to the shop must never grant anything under `/admin`, and signing
 * out of one should not sign you out of the other.
 */
export const CUSTOMER_COOKIE = "customer_session";
