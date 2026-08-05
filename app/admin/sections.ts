/**
 * The shop's day-to-day work, as opposed to editing content.
 *
 * First in the sidebar on purpose: this is the screen an admin opens every
 * morning, and everything below it is changed once and left alone.
 */
export const ADMIN_OPERATIONS = [
  {
    name: "Orders",
    href: "/admin/orders",
    description:
      "Every order placed, with its contact details and delivery address. Confirm manual payments and mark orders fulfilled here.",
  },
] as const;

/** Site-wide settings, not tied to one part of the page. */
export const ADMIN_SETTINGS = [
  {
    name: "Store settings",
    href: "/admin/store",
    description:
      "Name, contact details, address, opening hours, Facebook page and the manual payment QR code.",
  },
  {
    name: "Shipping",
    href: "/admin/shipping",
    description:
      "Whether delivery is charged, the flat rate, and per-region or per-city exceptions.",
  },
  {
    name: "Delivery dates",
    href: "/admin/delivery",
    description:
      "Which days customers can pick at checkout, the rush fee for last-minute orders, and one-off closures.",
  },
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
  {
    name: "Customer reviews",
    href: "/admin/reviews",
    description: "The curated quote cards, with a photo and star rating each.",
  },
  {
    name: "Studio gallery",
    href: "/admin/gallery",
    description: "The Instagram-style photo grid and its follow button.",
  },
  {
    name: "Promo banner",
    href: "/admin/promo",
    description:
      "The seasonal offer: copy, background photo, buttons and discount code. Can be switched off.",
  },
  {
    name: "FAQs",
    href: "/admin/faqs",
    description:
      "Questions and answers for both the home page block and the FAQ page.",
  },
] as const;
