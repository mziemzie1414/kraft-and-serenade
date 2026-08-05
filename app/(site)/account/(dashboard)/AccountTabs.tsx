"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Details", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Addresses", href: "/account/addresses" },
];

/**
 * The account section's own navigation.
 *
 * A client component only because the active tab needs the current path, which a
 * layout cannot read. Everything it renders is static.
 */
export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-moss-900 text-canvas"
                : "border border-canvas-deep text-ink-soft hover:border-ink-faint hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
