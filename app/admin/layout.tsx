import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_CATALOGUE, ADMIN_SECTIONS, ADMIN_SETTINGS } from "./sections";

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

function NavGroup({
  heading,
  items,
}: {
  heading: string;
  items: readonly { name: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="px-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">
        {heading}
      </h2>
      <ul className="mt-1 flex flex-wrap gap-1 lg:flex-col">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

        <nav aria-label="Admin" className="space-y-5 px-3 pb-6">
          <NavGroup heading="Settings" items={ADMIN_SETTINGS} />
          <NavGroup heading="Catalogue" items={ADMIN_CATALOGUE} />
          <NavGroup heading="Page sections" items={ADMIN_SECTIONS} />
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
