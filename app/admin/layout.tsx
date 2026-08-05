import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_SECTIONS } from "./sections";

export const metadata: Metadata = {
  title: "Admin",
  // The admin panel has no business in search results.
  robots: { index: false, follow: false },
};

/**
 * The admin panel must always show what is actually stored, so nothing here is
 * prerendered. The public landing page stays static and is revalidated on save.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-canvas-alt lg:flex-row">
      <aside className="border-b border-canvas-deep bg-canvas lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="px-6 py-6">
          <Link href="/admin" className="font-display text-lg font-medium text-ink">
            Site content
          </Link>
          <p className="mt-1 text-xs text-ink-faint">Kraft &amp; Serenade</p>
        </div>

        <nav aria-label="Sections" className="px-3 pb-6">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {ADMIN_SECTIONS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink"
                >
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden px-6 pb-6 lg:block">
          <Link
            href="/"
            className="text-xs font-medium text-ink-faint underline-offset-4 hover:text-ink hover:underline"
          >
            View the site
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
