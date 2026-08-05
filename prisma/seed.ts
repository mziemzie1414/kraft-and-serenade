import "dotenv/config";
import { BEST_SELLERS, CATEGORIES, FEATURED_PRODUCTS } from "../lib/data";
import { HERO_DEFAULTS, HERO_ID } from "../lib/hero";
import { prisma } from "../lib/prisma";
import { THEME_DEFAULTS, THEME_ID } from "../lib/theme";

/**
 * Product body copy, keyed by slug.
 *
 * `lib/data.ts` never carried descriptions — the landing page only ever showed a
 * name, a category and a price — so these are placeholder blurbs written to give
 * the new product pages something to render. Edit them in /admin/products.
 */
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  "blush-peony-serenade":
    "Pale pink and ivory roses gathered loose and low, with just enough foliage to keep the edges soft. Our most-gifted design, and the one we reach for when someone says they want something pretty but not loud.",
  "garden-rose-embrace":
    "Dense, fully open garden roses in blush and cream. Heavier and more fragrant than a standard rose bouquet, and it fills a room in a way the photographs never quite manage.",
  "sunlit-sunflower-cheer":
    "An armful of sunflowers cut with long stems and left tall. Sturdy heads that hold their cheer for well over a week, which makes this a good pick when you are not sure the recipient will fuss over a vase.",
  "tulip-whisper":
    "Seasonal imported tulips, bunched low and tied with ribbon. Tulips keep moving after they are cut, so expect the shape to open and shift a little each day.",
  "midnight-garden-mix":
    "Deep reds and near-black foliage with roses and ranunculus layered through. The one we build when someone asks for something that does not look like a standard bouquet.",
  "coral-sunset-vase":
    "Coral and burnt orange arranged in a small reusable vase, so it arrives ready to set down with no trimming needed. A good choice for an office or a hospital room.",
  "pearl-white-rose":
    "A single white rose, conditioned and wrapped properly. Small on purpose, for the notes that do not need a whole bouquet behind them.",
  "hydrangea-dream":
    "Blue and violet hydrangea heads clustered tight, with nothing else competing for attention. Thirsty flowers, so top the water up daily and they will reward you.",
  "ivory-eucalyptus-bridal":
    "Ivory roses threaded with eucalyptus and finished with a hand-bound stem wrap. Our most requested bridal design, and one we will happily scale for the rest of the party.",
  "rainbow-celebration":
    "Roses dyed across the full spectrum and built to be as loud as the occasion. Popular for debuts, coming-outs and any birthday that deserves a bit of noise.",
  "peach-dahlia-glow":
    "Peach and cream dahlias in soft daylight tones, cut short and gathered round. Dahlias bruise easily, so this one travels in a weighted carrier as standard.",
  "single-stem-rose":
    "One pink rose in a slim glass vase. Our go-to for small apologies and small victories, and the only thing on the shelf under a thousand pesos.",
};

/** The landing-page singletons: colour palette and Hero content. */
async function seedSiteContent() {
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
}

/**
 * Categories and products, taken from the hard-coded arrays in lib/data.ts.
 * Keyed on slug so re-running updates rows in place rather than duplicating
 * them, and never deletes anything added through the admin panel.
 */
async function seedCatalog() {
  for (const [index, category] of CATEGORIES.entries()) {
    const data = {
      name: category.name,
      shortName: category.shortName,
      description: category.description,
      imageUrl: category.image,
      imageAlt: category.imageAlt,
      position: index,
    };

    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, ...data },
      update: data,
    });
  }

  // Products reference their category by display name in lib/data.ts.
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const categoryIdByName = new Map(categories.map((row) => [row.name, row.id]));

  const products = [
    ...FEATURED_PRODUCTS.map((product) => ({
      product,
      isFeatured: true,
      bestSellerRank: null,
    })),
    // BEST_SELLERS was already in chart order, so the array index becomes the
    // rank. The landing section renders 1 as the lead tile and 2+ as the list.
    ...BEST_SELLERS.map((product, index) => ({
      product,
      isFeatured: false,
      bestSellerRank: index + 1,
    })),
  ];

  for (const [index, { product, isFeatured, bestSellerRank }] of products.entries()) {
    const categoryId = categoryIdByName.get(product.category);

    if (!categoryId) {
      throw new Error(
        `Product "${product.id}" refers to unknown category "${product.category}".`,
      );
    }

    const description = PRODUCT_DESCRIPTIONS[product.id];

    if (!description) {
      throw new Error(`Product "${product.id}" has no description.`);
    }

    const data = {
      name: product.name,
      description,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      imageUrl: product.image,
      imageAlt: product.imageAlt,
      rating: product.rating,
      reviewCount: product.reviewCount,
      badge: product.badge ?? null,
      isFeatured,
      bestSellerRank,
      position: index,
      categoryId,
    };

    // The `id` in lib/data.ts is already slug-shaped, so it becomes the slug.
    await prisma.product.upsert({
      where: { slug: product.id },
      create: { slug: product.id, ...data },
      update: data,
    });
  }

  return { categories: CATEGORIES.length, products: products.length };
}

/**
 * Seeds the content the site shipped with, so nothing changes visually after
 * moving off hard-coded data. Safe to re-run.
 */
async function main() {
  await seedSiteContent();
  const counts = await seedCatalog();

  console.log(
    `Seeded theme, hero_section, hero_trust_point, ` +
      `${counts.categories} categories and ${counts.products} products.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
