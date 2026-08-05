import Link from "next/link";
import { ADMIN_SECTIONS } from "./sections";

export default function AdminHomePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-medium text-ink">
        Landing page content
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Edit what visitors see on the home page. Changes go live as soon as you
        save.
      </p>

      <ul className="mt-8 space-y-3">
        {ADMIN_SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="block rounded-xl border border-canvas-deep bg-canvas p-5 transition-shadow hover:shadow-soft"
            >
              <span className="font-display text-base font-medium text-ink">
                {section.name}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                {section.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
