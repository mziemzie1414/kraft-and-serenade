import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { listCategories } from "@/lib/catalog-queries";
import type { NavCategory } from "@/lib/nav";
import { getStore } from "@/lib/store";
import type { LogoData } from "@/components/ui/Logo";

/** Storefront chrome. Everything the public site shares, minus `/admin`. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // Read once here and hand the same data to both the Navbar and the Footer, so
  // a category added in the admin panel shows up in both.
  const [categoryRows, store] = await Promise.all([listCategories(), getStore()]);

  const categories: NavCategory[] = categoryRows.map((category) => ({
    slug: category.slug,
    name: category.name,
    shortName: category.shortName,
    imageUrl: category.imageUrl,
    productCount: category._count.products,
  }));

  const logo: LogoData = {
    logoUrl: store.logoUrl,
    logoWidth: store.logoWidth,
    logoHeight: store.logoHeight,
  };

  return (
    <>
      {/* Targets the <main> below rather than a landing-page section, so the
          skip link works on every route. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-moss-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-canvas"
      >
        Skip to content
      </a>

      <Navbar categories={categories} storeName={store.storeName} logo={logo} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer categories={categories} store={store} logo={logo} />
    </>
  );
}
