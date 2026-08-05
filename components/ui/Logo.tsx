import Link from "next/link";
import { BRAND } from "@/lib/data";

/**
 * Brand mark. The glyph is inline SVG so the logo can never render as a
 * broken image, and it inherits the surrounding text colour.
 */
export function Logo({
  href = "/",
  tone = "ink",
  className = "",
}: {
  href?: string;
  tone?: "ink" | "light";
  className?: string;
}) {
  const textColor = tone === "light" ? "text-canvas" : "text-ink";
  const markColor = tone === "light" ? "text-blush-300" : "text-moss-700";

  return (
    <Link
      href={href}
      aria-label={`${BRAND.name} — home`}
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        className={`h-9 w-9 shrink-0 transition-transform duration-500 group-hover:rotate-12 ${markColor}`}
        aria-hidden
        focusable="false"
      >
        {/* Simple five-petal bloom on a stem */}
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="20" cy="14" r="3.2" />
          <path d="M20 10.8c0-3.4 2.4-5.6 5-5.2.5 3.1-1.6 5.4-5 5.2Z" />
          <path d="M23.2 14c3.4 0 5.6 2.4 5.2 5-3.1.5-5.4-1.6-5.2-5Z" />
          <path d="M16.8 14c-3.4 0-5.6 2.4-5.2 5 3.1.5 5.4-1.6 5.2-5Z" />
          <path d="M20 10.8c0-3.4-2.4-5.6-5-5.2-.5 3.1 1.6 5.4 5 5.2Z" />
          <path d="M20 17.2V34" />
          <path d="M20 24c-2.6-.4-4.4-2.2-4.8-4.8 2.6.4 4.4 2.2 4.8 4.8Z" />
          <path d="M20 28.5c2.6-.4 4.4-2.2 4.8-4.8-2.6.4-4.4 2.2-4.8 4.8Z" />
        </g>
      </svg>
      <span className={`flex flex-col leading-none ${textColor}`}>
        <span className="font-display text-[1.15rem] font-semibold tracking-tight">
          Kraft <span className="text-blush-500">&amp;</span> Serenade
        </span>
        <span
          className={`mt-1 text-[0.6rem] font-medium uppercase tracking-[0.22em] ${
            tone === "light" ? "text-canvas/60" : "text-ink-faint"
          }`}
        >
          Florist Studio
        </span>
      </span>
    </Link>
  );
}
