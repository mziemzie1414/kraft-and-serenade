import { HERO_DEFAULTS, HERO_ID, type HeroContent } from "./hero";
import { prisma } from "./prisma";

/**
 * The stored Hero row, or `null` if it has not been created yet. The admin page
 * uses this directly because it also needs `updatedAt`.
 */
export async function getHeroRecord() {
  return prisma.heroSection.findUnique({
    where: { id: HERO_ID },
    include: { trustPoints: { orderBy: { position: "asc" } } },
  });
}

/** Reads the live Hero content, falling back to the shipped defaults. */
export async function getHeroContent(): Promise<HeroContent> {
  return (await getHeroRecord()) ?? HERO_DEFAULTS;
}
