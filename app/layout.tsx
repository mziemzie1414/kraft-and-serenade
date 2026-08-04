import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { BRAND } from "@/lib/data";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      /* Opts into Next's scroll-behaviour override so in-page anchor links
         animate smoothly but route changes still jump instantly. */
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#featured"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-moss-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-canvas"
        >
          Skip to content
        </a>

        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
