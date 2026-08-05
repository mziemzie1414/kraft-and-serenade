/**
 * Shared helpers for categories and products.
 *
 * Kept free of database imports so the admin forms (Client Components) can
 * share it. Reads live in `lib/catalog-queries.ts`.
 */

/** Lowercase, hyphen-separated, no leading or trailing hyphen. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/**
 * Derives a URL slug from a name, so the admin can leave the slug field blank
 * on a new record rather than hand-typing it.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // Drop accents so "Ros\u00e9" becomes "rose" rather than losing the letter.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Widest edge we keep for catalogue photography. */
export const CATEGORY_IMAGE_WIDTH = 1200;
export const PRODUCT_IMAGE_WIDTH = 1600;
