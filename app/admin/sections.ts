/** Site-wide settings, not tied to one part of the page. */
export const ADMIN_SETTINGS = [
  {
    name: "Colours",
    href: "/admin/theme",
    description:
      "The palette used across the whole site: surfaces, text, primary, accent and the star rating.",
  },
] as const;

/** The shop itself. Shared by the storefront and, later, the landing page. */
export const ADMIN_CATALOGUE = [
  {
    name: "Categories",
    href: "/admin/categories",
    description:
      "Bouquet types customers browse by. Each product belongs to one of these.",
  },
  {
    name: "Products",
    href: "/admin/products",
    description:
      "Every bouquet design: photo, price, rating, whether it is featured and its best seller rank.",
  },
  {
    name: "Occasions",
    href: "/admin/occasions",
    description:
      "The \u201cShop by occasion\u201d tiles on the home page, each pointing at a category.",
  },
] as const;

/**
 * Landing page sections that can be edited from the admin panel.
 *
 * Sections are moved off hard-coded content one at a time; this list grows as
 * each one lands.
 */
export const ADMIN_SECTIONS = [
  {
    name: "Hero",
    href: "/admin/hero",
    description:
      "The full-screen opener: headline, buttons, background photo, social proof and the trust bar.",
  },
  {
    name: "Why choose us",
    href: "/admin/why-choose-us",
    description:
      "Studio photographs, the selling points beside them, and the stat strip below.",
  },
  {
    name: "How it works",
    href: "/admin/how-it-works",
    description: "The four numbered steps and the callout panel under them.",
  },
] as const;
