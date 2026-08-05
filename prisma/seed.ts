import "dotenv/config";
import { HERO_DEFAULTS, HERO_ID } from "../lib/hero";
import { prisma } from "../lib/prisma";
import { THEME_DEFAULTS, THEME_ID } from "../lib/theme";

/**
 * Seeds the content the landing page shipped with, so the site looks identical
 * after moving off hard-coded data. Safe to re-run: it resets every seeded row
 * back to those defaults.
 */
async function main() {
  await prisma.theme.upsert({
    where: { id: THEME_ID },
    create: { id: THEME_ID, ...THEME_DEFAULTS },
    update: THEME_DEFAULTS,
  });

  const { trustPoints, ...hero } = HERO_DEFAULTS;

  await prisma.heroSection.upsert({
    where: { id: HERO_ID },
    create: { id: HERO_ID, ...hero },
    update: hero,
  });

  await prisma.heroTrustPoint.deleteMany({ where: { heroSectionId: HERO_ID } });
  await prisma.heroTrustPoint.createMany({
    data: trustPoints.map((point, index) => ({
      ...point,
      position: index,
      heroSectionId: HERO_ID,
    })),
  });

  console.log("Seeded theme, hero_section and hero_trust_point.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
