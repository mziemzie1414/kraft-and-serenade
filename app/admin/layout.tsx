import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  // The admin panel has no business in search results.
  robots: { index: false, follow: false },
};

/**
 * Everything under /admin reads live data and depends on the session cookie, so
 * none of it is prerendered.
 */
export const dynamic = "force-dynamic";

/**
 * Deliberately bare. The sign-in page sits at this level so it is outside the
 * guard in `(panel)/layout.tsx` — sharing that layout would redirect the login
 * page to itself.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
