import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const WHY_CHOOSE_US_ID = "why-choose-us";

export type WhyChooseUsContent = {
  eyebrow: string;
  title: string;
  lede: string;
  primaryImageUrl: string;
  primaryImageAlt: string;
  secondaryImageUrl: string;
  badgeValue: string;
  badgeLabel: string;
  points: { title: string; body: string }[];
  stats: { value: string; label: string }[];
};

/**
 * The content the section shipped with. Seeds the database and doubles as the
 * fallback if the row has not been created yet, so the page renders the same
 * either way.
 */
export const WHY_CHOOSE_US_DEFAULTS: WhyChooseUsContent = {
  eyebrow: "Why choose us",
  title: "A studio, not a warehouse",
  lede: "We are four florists working out of one room in Pasig. That limits how many bouquets we can make in a day, which is the whole point.",
  primaryImageUrl: "/images/about/flower-shop.jpg",
  primaryImageAlt:
    "The Kraft and Serenade studio frontage, filled with buckets of fresh stems",
  secondaryImageUrl: "/images/about/craft-table.jpg",
  badgeValue: "6",
  badgeLabel: "Years on\nMarigold Lane",
  points: [
    {
      title: "Cut this morning, not last week",
      body: "We buy at the Dangwa market at 4am and only build with what passed inspection. Anything we would not keep ourselves does not go out.",
    },
    {
      title: "Made by one of four florists",
      body: "No assembly line. A named florist builds your bouquet start to finish and signs the care card that ships with it.",
    },
    {
      title: "You see it before we cut it",
      body: "For custom and event work we send a mock-up photo for approval, so there are no surprises on the doorstep.",
    },
    {
      title: "Delivered upright, in water",
      body: "Bouquets travel in weighted, water-filled carriers with our own riders inside Metro Manila. No bouquet lies flat in a trunk.",
    },
  ],
  stats: [
    { value: "1,240+", label: "Orders delivered" },
    { value: "4.9/5", label: "Average rating" },
    { value: "4am", label: "Daily market run" },
    { value: "9 days", label: "Typical vase life" },
  ],
};

/** The stored row, or `null` if it has not been created yet. */
export async function getWhyChooseUsRecord() {
  return prisma.whyChooseUsSection.findUnique({
    where: { id: WHY_CHOOSE_US_ID },
    include: {
      points: { orderBy: { position: "asc" } },
      stats: { orderBy: { position: "asc" } },
    },
  });
}

/** Reads the live content, falling back to the shipped defaults. */
export async function getWhyChooseUsContent(): Promise<WhyChooseUsContent> {
  return (await getWhyChooseUsRecord()) ?? WHY_CHOOSE_US_DEFAULTS;
}
