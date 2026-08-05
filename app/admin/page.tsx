import Link from "next/link";
import { ADMIN_CATALOGUE, ADMIN_SECTIONS, ADMIN_SETTINGS } from "./sections";

function CardList({
  heading,
  items,
}: {
  heading: string;
  items: readonly { name: string; href: string; description: string }[];
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
        {heading}
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-canvas-deep bg-canvas p-5 transition-shadow hover:shadow-soft"
            >
              <span className="font-display text-base font-medium text-ink">
                {item.name}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                {item.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AdminHomePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-medium text-ink">Site content</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Edit what visitors see. Changes go live as soon as you save.
      </p>

      <CardList heading="Settings" items={ADMIN_SETTINGS} />
      <CardList heading="Catalogue" items={ADMIN_CATALOGUE} />
      <CardList heading="Page sections" items={ADMIN_SECTIONS} />
    </div>
  );
}
