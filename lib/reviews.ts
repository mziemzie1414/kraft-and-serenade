import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const REVIEWS_ID = "reviews";

export type ReviewsContent = {
  eyebrow: string;
  title: string;
  lede: string;
  reviews: {
    name: string;
    location: string;
    quote: string;
    rating: number;
    avatarUrl: string;
    purchased: string;
  }[];
};

/**
 * The content the section shipped with. Seeds the database and doubles as the
 * fallback if the row has not been created yet, so the page renders the same
 * either way.
 */
export const REVIEWS_DEFAULTS: ReviewsContent = {
  eyebrow: "Customer reviews",
  title: "What people actually said",
  lede: "Pulled from verified order confirmations. We publish the four-star ones too.",
  reviews: [
    {
      name: "Mara Villanueva",
      location: "Quezon City",
      rating: 5,
      quote:
        "Ordered a graduation bouquet the night before and it still arrived by 9am. The money fold was neater than anything I could have done myself.",
      avatarUrl: "/images/reviews/avatar-01.jpg",
      purchased: "Graduation Bouquet",
    },
    {
      name: "Dan Escobar",
      location: "Makati",
      rating: 5,
      quote:
        "I asked for something that did not look like a standard anniversary bouquet and they nailed it. Deep reds, almost black foliage. My wife kept it for two weeks.",
      avatarUrl: "/images/reviews/avatar-02.jpg",
      purchased: "Midnight Garden Mix",
    },
    {
      name: "Chelsea Ong",
      location: "Pasig",
      rating: 4,
      quote:
        "Beautiful tulips and genuinely fresh. Delivery window was a little wide, but the courier called ahead which I appreciated.",
      avatarUrl: "/images/reviews/avatar-03.jpg",
      purchased: "Tulip Whisper",
    },
    {
      name: "Miguel Santos",
      location: "Mandaluyong",
      rating: 5,
      quote:
        "Used them for our wedding. They sent a mock-up photo three days before so we could adjust the palette. Very easy to work with.",
      avatarUrl: "/images/reviews/avatar-04.jpg",
      purchased: "Ivory & Eucalyptus Bridal",
    },
    {
      name: "Alyssa Reyes",
      location: "San Juan",
      rating: 5,
      quote:
        "The single stem rose is my go-to for small apologies and small victories. Wrapped properly every single time.",
      avatarUrl: "/images/reviews/avatar-05.jpg",
      purchased: "Single Stem, Long Story",
    },
  ],
};

/** The stored row, or `null` if it has not been created yet. */
export async function getReviewsRecord() {
  return prisma.reviewsSection.findUnique({
    where: { id: REVIEWS_ID },
    include: { reviews: { orderBy: { position: "asc" } } },
  });
}

/** Reads the live content, falling back to the shipped defaults. */
export async function getReviewsContent(): Promise<ReviewsContent> {
  return (await getReviewsRecord()) ?? REVIEWS_DEFAULTS;
}
