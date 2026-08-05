import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { BRAND } from "@/lib/data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Hand-tied bouquets in Metro Manila`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "A four-person florist studio in Pasig City. Hand-tied graduation, birthday, anniversary, wedding and custom bouquets, with same-day delivery across Metro Manila.",
  keywords: [
    "bouquet delivery Manila",
    "graduation bouquet",
    "money bouquet",
    "wedding florist Pasig",
    "flower delivery Philippines",
  ],
  openGraph: {
    title: `${BRAND.name} — Hand-tied bouquets in Metro Manila`,
    description:
      "Market-fresh, hand-tied bouquets for graduations, birthdays, weddings and ordinary Tuesdays. Same-day delivery across Metro Manila.",
    type: "website",
    locale: "en_PH",
    siteName: BRAND.name,
  },
};

/**
 * Root layout. Only owns the document shell and fonts — the storefront chrome
 * lives in `app/(site)/layout.tsx` so `/admin` can opt out of it.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      /* Opts into Next's scroll-behaviour override so in-page anchor links
         animate smoothly but route changes still jump instantly. */
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
