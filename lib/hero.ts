/**
 * Shape, defaults and validation for the Hero section. Kept free of database
 * imports so the admin form (a Client Component) can share it.
 *
 * Reads live in `lib/hero-queries.ts`.
 */

/**
 * The Hero section is a singleton: one row, addressed by a fixed id. Using a
 * known id keeps reads and the admin upsert trivial, with no "which row is
 * live?" question to answer.
 */
export const HERO_ID = "hero";

/** Icon keys the trust bar knows how to render. */
export const TRUST_POINT_ICONS = ["leaf", "truck", "sparkle", "peso"] as const;

export type TrustPointIcon = (typeof TRUST_POINT_ICONS)[number];

export function isTrustPointIcon(value: string): value is TrustPointIcon {
  return (TRUST_POINT_ICONS as readonly string[]).includes(value);
}

export type HeroTrustPointContent = {
  label: string;
  icon: string;
  /** Hidden below `lg` so the trust bar does not wrap on small screens. */
  desktopOnly: boolean;
};

export type HeroContent = {
  eyebrow: string;
  headingLead: string;
  headingAccent: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  backgroundImageUrl: string;
  backgroundImageAlt: string;
  ratingValue: number;
  ratingCaption: string;
  reviewAvatarUrls: string[];
  accentImageUrl: string;
  accentTitle: string;
  accentCaption: string;
  trustPoints: HeroTrustPointContent[];
};

/**
 * The content the landing page shipped with. It seeds the database and doubles
 * as the fallback if the row has not been created yet, so the page renders the
 * same either way.
 */
export const HERO_DEFAULTS: HeroContent = {
  eyebrow: "Cut at 4am. On your doorstep by lunch.",
  headingLead: "Flowers that say it",
  headingAccent: "without saying much",
  description:
    "A small Pasig studio making hand-tied bouquets for graduations, birthdays, weddings and ordinary Tuesdays. Ten designs on the shelf, or tell us the colours and we will build it.",
  primaryCtaLabel: "Shop the bouquets",
  primaryCtaHref: "#featured",
  secondaryCtaLabel: "Browse categories",
  secondaryCtaHref: "#shop-by-category",
  backgroundImageUrl: "/images/hero/hero-bouquet.jpg",
  backgroundImageAlt:
    "Florist holding a large hand-tied bouquet of roses, ranunculus and eucalyptus",
  ratingValue: 4.9,
  ratingCaption: "4.9 from 1,240+ local orders",
  reviewAvatarUrls: [
    "/images/reviews/avatar-01.jpg",
    "/images/reviews/avatar-02.jpg",
    "/images/reviews/avatar-03.jpg",
    "/images/reviews/avatar-04.jpg",
  ],
  accentImageUrl: "/images/hero/hero-accent.jpg",
  accentTitle: "Blush Peony Serenade",
  accentCaption: "Most gifted this month",
  trustPoints: [
    { icon: "leaf", label: "Market-fresh daily", desktopOnly: false },
    { icon: "truck", label: "Same-day in Metro Manila", desktopOnly: false },
    { icon: "sparkle", label: "Hand-tied to order", desktopOnly: false },
    { icon: "peso", label: "Free delivery over ₱3,500", desktopOnly: true },
  ],
};

/** Human-readable names for the trust bar icon keys, for the admin dropdown. */
export const TRUST_POINT_ICON_LABELS: Record<TrustPointIcon, string> = {
  leaf: "Leaf",
  truck: "Delivery truck",
  sparkle: "Sparkle",
  peso: "Peso sign",
};
