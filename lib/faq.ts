import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const FAQ_ID = "faqs";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  showOnHome: boolean;
};

export type FaqContent = {
  eyebrow: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
  pageTitle: string;
  pageLede: string;
  faqs: FaqItem[];
};

/**
 * The content the section shipped with. Seeds the database and doubles as the
 * fallback if the row has not been created yet, so the page renders the same
 * either way.
 *
 * The ids here are only used by the fallback; stored rows get real uuids.
 */
export const FAQ_DEFAULTS: FaqContent = {
  eyebrow: "FAQs",
  title: "The questions we get most",
  lede: "Delivery, freshness, substitutions and custom work. If your question is not here, message us and we will answer it properly.",
  ctaLabel: "Ask us something else",
  ctaHref: "/#contact",
  pageTitle: "Frequently asked questions",
  pageLede:
    "Everything we get asked about delivery, freshness, substitutions and custom work, in one place.",
  faqs: [
    {
      id: "faq-delivery-areas",
      question: "Where do you deliver?",
      answer:
        "We deliver across Metro Manila daily, and to Rizal, Cavite, Laguna and Bulacan on scheduled runs. Anything outside those areas is quoted per order, so message us with the address first.",
      showOnHome: true,
    },
    {
      id: "faq-same-day",
      question: "Can I order for same-day delivery?",
      answer:
        "Yes, for orders placed before 1:00 PM on the day itself, subject to what is on the bench that morning. After the cut-off we will book you into the first slot the next day rather than send something we are not happy with.",
      showOnHome: true,
    },
    {
      id: "faq-freshness",
      question: "How long will the flowers last?",
      answer:
        "Expect five to nine days depending on the variety and your room temperature. Every bouquet ships with a care card, and trimming 1cm off the stems with a fresh water change every other day makes the biggest difference.",
      showOnHome: true,
    },
    {
      id: "faq-custom",
      question: "Can I request a custom bouquet?",
      answer:
        "That is most of what we do. Send us a palette, a budget and the occasion. We will reply with a proposed stem list and a mock-up photo before anything is cut.",
      showOnHome: true,
    },
    {
      id: "faq-money-bouquets",
      question: "How do money bouquets work?",
      answer:
        "You choose the bouquet size and provide the bills, or we can source clean bills for an added handling fee. We fold and mount them ourselves so nothing is taped directly to the cash.",
      showOnHome: true,
    },
    {
      id: "faq-substitutions",
      question: "What if a flower I picked is unavailable?",
      answer:
        "Flowers are seasonal, so we substitute like for like in colour and weight and message you before dispatch. If the swap does not sit right with you, we will cancel and refund in full.",
      showOnHome: true,
    },
    {
      id: "faq-cancellations",
      question: "What is your cancellation policy?",
      answer:
        "Cancel free of charge up to 24 hours before your delivery window. Inside 24 hours we have usually already bought and conditioned your stems, so we can offer store credit instead.",
      showOnHome: true,
    },
  ],
};

/** The stored row, or `null` if it has not been created yet. */
export async function getFaqRecord() {
  return prisma.faqSection.findUnique({
    where: { id: FAQ_ID },
    include: { faqs: { orderBy: { position: "asc" } } },
  });
}

/** Reads the live content, falling back to the shipped defaults. */
export async function getFaqContent(): Promise<FaqContent> {
  return (await getFaqRecord()) ?? FAQ_DEFAULTS;
}
