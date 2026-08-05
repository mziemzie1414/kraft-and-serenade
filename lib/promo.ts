import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const PROMO_ID = "promo";

export type PromoContent = {
  isPublished: boolean;
  badge: string;
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  codeLabel: string;
  code: string | null;
  codeNote: string;
};

/**
 * The content the section shipped with. Seeds the database and doubles as the
 * fallback if the row has not been created yet, so the page renders the same
 * either way.
 */
export const PROMO_DEFAULTS: PromoContent = {
  isPublished: true,
  badge: "Graduation season",
  title: "15% off graduation and money bouquets",
  body: "Booked in advance for March and April ceremonies. Add a ribbon sash and a folded-bill accent at no extra charge when you order two weeks ahead.",
  imageUrl: "/images/banners/promo-spring.jpg",
  imageAlt: "A garden walkway lined with blooming rose bushes",
  primaryCtaLabel: "Shop graduation",
  primaryCtaHref: "/products?category=graduation-bouquets",
  secondaryCtaLabel: "Shop money bouquets",
  secondaryCtaHref: "/products?category=money-bouquets",
  codeLabel: "Use code",
  code: "TOGA15",
  codeNote: "Valid until 30 April on orders over ₱2,000. One use per customer.",
};

/** The stored row, or `null` if it has not been created yet. */
export async function getPromoRecord() {
  return prisma.promoBannerSection.findUnique({ where: { id: PROMO_ID } });
}

/** Reads the live content, falling back to the shipped defaults. */
export async function getPromoContent(): Promise<PromoContent> {
  return (await getPromoRecord()) ?? PROMO_DEFAULTS;
}
