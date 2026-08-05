/** Site-wide settings, not tied to one part of the page. */
export const ADMIN_SETTINGS = [
  {
    name: "Colours",
    href: "/admin/theme",
    description:
      "The palette used across the whole site: surfaces, text, primary, accent and the star rating.",
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
] as const;
