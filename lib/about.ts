/**
 * Shape, defaults and the singleton id for the About section. Kept free of
 * database imports so the admin form (a Client Component) can share it.
 *
 * Reads live in `lib/about-queries.ts`.
 */

export const ABOUT_ID = "about";

export type AboutContent = {
  eyebrow: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
};

/**
 * The content the About page ships with. Seeds the database and serves as the
 * fallback if the row has not been created yet.
 */
export const ABOUT_DEFAULTS: AboutContent = {
  eyebrow: "Our story",
  title: "A small studio with big blooms",
  body: "Kraft & Serenade started in a spare room on Marigold Lane, Pasig City, with a cooler, a workbench and one standing order from a café down the street.\n\nSix years and several thousand bouquets later, the room got bigger but the team stayed small on purpose. Every arrangement is still built by the same hands that buy the stems at the market before dawn — so what you see on the shelf is never more than a few hours old.\n\nWe specialise in hand-tied bouquets for the moments that matter: graduations, birthdays, weddings, and the ordinary Tuesdays that deserve flowers too. If you have a colour palette or a feeling in mind, tell us and we will build something that fits.",
  imageUrl: "/images/about/studio.jpg",
  imageAlt:
    "The Kraft & Serenade studio workbench with fresh flowers and wrapping paper",
};
