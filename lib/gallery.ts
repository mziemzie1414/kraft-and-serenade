import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const GALLERY_ID = "gallery";

export type GalleryContent = {
  eyebrow: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
  images: {
    imageUrl: string;
    alt: string;
    caption: string;
    linkUrl: string | null;
  }[];
};

/**
 * The content the section shipped with. Seeds the database and doubles as the
 * fallback if the row has not been created yet, so the page renders the same
 * either way.
 */
export const GALLERY_DEFAULTS: GalleryContent = {
  eyebrow: "From the studio",
  title: "@kraftandserenade",
  lede: "Bench shots, market hauls and finished bouquets. Tag us and we will repost.",
  ctaLabel: "Follow along",
  // Placeholder: point this at the real profile from /admin/gallery.
  ctaHref: "#gallery",
  images: [
    {
      imageUrl: "/images/gallery/gallery-01.jpg",
      alt: "Field of red poppies in soft light",
      caption: "Field poppies, June",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-02.jpg",
      alt: "Yellow poppies against a blue sky",
      caption: "Golden hour blooms",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-03.jpg",
      alt: "Pale blue roses photographed at dusk",
      caption: "Dusk roses",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-04.jpg",
      alt: "Mass of red begonia flowers",
      caption: "Red on red",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-05.jpg",
      alt: "Cherry blossom branches in bloom",
      caption: "Blossom season",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-06.jpg",
      alt: "Gifts wrapped in red and white paper",
      caption: "Gift notes in every order",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-07.jpg",
      alt: "Potting scoop, soil and shears on a work surface",
      caption: "Bench, 6am",
      linkUrl: null,
    },
    {
      imageUrl: "/images/gallery/gallery-08.jpg",
      alt: "Flower shop display filled with fresh stems",
      caption: "Marigold Lane studio",
      linkUrl: null,
    },
  ],
};

/** The stored row, or `null` if it has not been created yet. */
export async function getGalleryRecord() {
  return prisma.gallerySection.findUnique({
    where: { id: GALLERY_ID },
    include: { images: { orderBy: { position: "asc" } } },
  });
}

/** Reads the live content, falling back to the shipped defaults. */
export async function getGalleryContent(): Promise<GalleryContent> {
  return (await getGalleryRecord()) ?? GALLERY_DEFAULTS;
}
