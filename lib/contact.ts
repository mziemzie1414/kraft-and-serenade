/**
 * Shape, defaults and the singleton id for the Contact section. Kept free of
 * database imports so the admin form (a Client Component) can share it.
 *
 * Reads live in `lib/contact-queries.ts`.
 */

export const CONTACT_ID = "contact";

export type ContactContent = {
  eyebrow: string;
  title: string;
  body: string;
  address: string;
  phone: string;
  mapEmbedUrl: string | null;
};

/**
 * The content the Contact page ships with. Seeds the database and serves as
 * the fallback if the row has not been created yet.
 */
export const CONTACT_DEFAULTS: ContactContent = {
  eyebrow: "Get in touch",
  title: "We would love to hear from you",
  body: "Whether you have a question about an order, need help choosing flowers for a specific occasion, or want to discuss a custom arrangement, our team is here to help.",
  address: "Marigold Lane, Pasig City, Metro Manila, Philippines",
  phone: "+63 917 123 4567",
  mapEmbedUrl: null,
};
