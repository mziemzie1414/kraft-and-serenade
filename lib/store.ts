import { prisma } from "./prisma";

/** One row, addressed by a fixed id. */
export const STORE_ID = "store";

export type StoreContent = {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  addressLines: string[];
  facebookUrl: string;
  manualPaymentQrUrl: string | null;
  manualPaymentInstructions: string;
  logoUrl: string | null;
  logoWidth: number | null;
  logoHeight: number | null;
  businessHours: { days: string; hours: string }[];
};

/**
 * The details the site shipped with, taken from `BRAND` and `BUSINESS_HOURS` in
 * lib/data.ts. Seeds the database and doubles as the fallback if the row has not
 * been created yet.
 */
export const STORE_DEFAULTS: StoreContent = {
  storeName: "Kraft & Serenade",
  tagline: "Hand-tied bouquets, quietly made",
  email: "hello@kraftandserenade.com",
  phone: "+63 917 555 0142",
  addressLines: [
    "112 Marigold Lane, Unit 4",
    "Barangay San Antonio",
    "Pasig City, Metro Manila 1600",
  ],
  // Placeholder: set the real page in /admin/store. Manual-payment customers are
  // told to message this, so it needs to be right before that goes live.
  facebookUrl: "https://facebook.com/kraftandserenade",
  manualPaymentQrUrl: null,
  manualPaymentInstructions:
    "Scan the QR code to pay, then send us your order number and a screenshot of the receipt on Facebook so we can confirm it.",
  logoUrl: null,
  logoWidth: null,
  logoHeight: null,
  businessHours: [
    { days: "Monday – Friday", hours: "8:00 AM – 7:00 PM" },
    { days: "Saturday", hours: "8:00 AM – 8:00 PM" },
    { days: "Sunday", hours: "9:00 AM – 5:00 PM" },
    { days: "Public holidays", hours: "10:00 AM – 4:00 PM" },
  ],
};

/** The stored row, or `null` if it has not been created yet. */
export async function getStoreRecord() {
  return prisma.storeSettings.findUnique({
    where: { id: STORE_ID },
    include: { businessHours: { orderBy: { position: "asc" } } },
  });
}

/** Reads the live store details, falling back to the shipped defaults. */
export async function getStore(): Promise<StoreContent> {
  return (await getStoreRecord()) ?? STORE_DEFAULTS;
}
