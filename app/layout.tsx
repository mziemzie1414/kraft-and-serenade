import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { getStore } from "@/lib/store";
import { getThemeContent } from "@/lib/theme-queries";
import { themeCss } from "@/lib/theme";
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

/** Titles carry the store name, so this is generated rather than static. */
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  const title = `${store.storeName} — Hand-tied bouquets in Metro Manila`;

  return {
    title: { default: title, template: `%s · ${store.storeName}` },
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
      title,
      description:
        "Market-fresh, hand-tied bouquets for graduations, birthdays, weddings and ordinary Tuesdays. Same-day delivery across Metro Manila.",
      type: "website",
      locale: "en_PH",
      siteName: store.storeName,
    },
  };
}

/**
 * Root layout. Owns the document shell, fonts and the colour palette — the
 * storefront chrome lives in `app/(site)/layout.tsx` so `/admin` can opt out
 * of it.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getThemeContent();

  return (
    <html
      lang="en"
      /* Opts into Next's scroll-behaviour override so in-page anchor links
         animate smoothly but route changes still jump instantly. */
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} h-full`}
    >
      {/* Overrides the palette Tailwind compiled into the stylesheet. React
          hoists this into <head>, and `href` keeps it deduplicated. */}
      <style href="theme-palette" precedence="high">
        {themeCss(theme)}
      </style>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
