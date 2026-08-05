import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const HOW_IT_WORKS_ID = "how-it-works";

export type HowItWorksContent = {
  eyebrow: string;
  title: string;
  lede: string;
  calloutTitle: string;
  calloutBody: string;
  calloutCtaLabel: string;
  calloutCtaHref: string;
  steps: { label: string; title: string; body: string }[];
};

/**
 * The content the section shipped with. Seeds the database and doubles as the
 * fallback if the row has not been created yet, so the page renders the same
 * either way.
 */
export const HOW_IT_WORKS_DEFAULTS: HowItWorksContent = {
  eyebrow: "How it works",
  title: "Four steps, no phone tag",
  lede: "From picking a bouquet to a photo of it in someone's hands. Most orders take under five minutes to place.",
  calloutTitle: "Need something for tomorrow morning?",
  calloutBody:
    "Order before 1:00 PM for same-day, or any time for next-day delivery.",
  calloutCtaLabel: "Start an order",
  calloutCtaHref: "#featured",
  steps: [
    {
      label: "01",
      title: "Pick a bouquet or a palette",
      body: "Start from a ready-made design, or just tell us the colours and the feeling you are after.",
    },
    {
      label: "02",
      title: "Add the details",
      body: "Choose the size, the wrap, and write your gift note. Money folds and ribbon sashes get added here.",
    },
    {
      label: "03",
      title: "Approve the mock-up",
      body: "Custom orders get a photo of the build for sign-off. Ready-made designs skip straight to the bench.",
    },
    {
      label: "04",
      title: "We deliver it upright",
      body: "Your bouquet leaves in water and arrives in a window you choose, with a photo sent on hand-off.",
    },
  ],
};

/** The stored row, or `null` if it has not been created yet. */
export async function getHowItWorksRecord() {
  return prisma.howItWorksSection.findUnique({
    where: { id: HOW_IT_WORKS_ID },
    include: { steps: { orderBy: { position: "asc" } } },
  });
}

/** Reads the live content, falling back to the shipped defaults. */
export async function getHowItWorksContent(): Promise<HowItWorksContent> {
  return (await getHowItWorksRecord()) ?? HOW_IT_WORKS_DEFAULTS;
}
