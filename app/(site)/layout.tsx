import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/** Storefront chrome. Everything the public site shares, minus `/admin`. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#featured"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-moss-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Skip to content
      </a>

      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
