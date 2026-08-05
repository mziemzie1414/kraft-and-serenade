/**
 * The category data the shared chrome needs.
 *
 * The Navbar and Footer are rendered by `app/(site)/layout.tsx`, which reads the
 * categories once and passes them down, so the two can never disagree about what
 * the shop contains.
 */
export type NavCategory = {
  slug: string;
  name: string;
  shortName: string;
  imageUrl: string;
  /** Live count of products in the category. */
  productCount: number;
};

/** Link to a category's listing on the catalogue page. */
export function categoryHref(slug: string): string {
  return `/products?category=${slug}`;
}
