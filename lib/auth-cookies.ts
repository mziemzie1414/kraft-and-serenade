/**
 * Cookie names only.
 *
 * Kept in its own module with no imports so `proxy.ts` can use it. Pulling these
 * from `lib/auth.ts` would drag Prisma and `node:crypto` into the proxy bundle,
 * which does not run in that environment.
 */
export const ADMIN_COOKIE = "admin_session";
