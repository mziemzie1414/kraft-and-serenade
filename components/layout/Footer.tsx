import Link from "next/link";
import { BRAND, BUSINESS_HOURS } from "@/lib/data";
import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PinterestIcon,
  TiktokIcon,
} from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { categoryHref, type NavCategory } from "@/lib/nav";

const SHOP_LINKS = [
  { label: "Featured bouquets", href: "/#featured" },
  { label: "Best sellers", href: "/#best-sellers" },
  { label: "Shop by occasion", href: "/#occasions" },
  { label: "Shop by category", href: "/#shop-by-category" },
  { label: "Current promo", href: "/#promo" },
];

const COMPANY_LINKS = [
  { label: "About the studio", href: "/#about" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Customer reviews", href: "/#reviews" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/#contact" },
];

const SOCIALS = [
  { label: "Instagram", href: "/#gallery", Icon: InstagramIcon },
  { label: "Facebook", href: "/#gallery", Icon: FacebookIcon },
  { label: "TikTok", href: "/#gallery", Icon: TiktokIcon },
  { label: "Pinterest", href: "/#gallery", Icon: PinterestIcon },
];

export function Footer({ categories }: { categories: NavCategory[] }) {
  const year = new Date().getFullYear();
  // Top six only, so the footer stays scannable rather than listing every one.
  const footerCategories = categories.slice(0, 6);

  return (
    <footer id="contact" className="scroll-mt-24 bg-moss-900 text-canvas">
      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand + socials */}
          <div className="lg:col-span-4">
            <Logo tone="light" />

            <p className="mt-6 max-w-xs text-sm leading-relaxed text-canvas/60">
              {BRAND.tagline}. A four-person florist studio in Pasig City,
              delivering across Metro Manila since 2020.
            </p>

            <div className="mt-7">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-canvas/40">
                Follow us
              </p>
              <ul className="mt-3 flex items-center gap-2.5">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      aria-label={`${BRAND.name} on ${label}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-canvas/15 text-canvas/70 transition-colors duration-300 hover:border-canvas/40 hover:bg-canvas/10 hover:text-canvas"
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation columns */}
          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
            <div>
              <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-canvas/40">
                Shop
              </h2>
              <ul className="mt-4 space-y-2.5">
                {SHOP_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-canvas/65 transition-colors duration-300 hover:text-canvas"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-canvas/40">
                Bouquets
              </h2>
              <ul className="mt-4 space-y-2.5">
                {footerCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={categoryHref(category.slug)}
                      className="text-sm text-canvas/65 transition-colors duration-300 hover:text-canvas"
                    >
                      {category.shortName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-canvas/40">
                Studio
              </h2>
              <ul className="mt-4 space-y-2.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-canvas/65 transition-colors duration-300 hover:text-canvas"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Contact + hours */}
          <div className="lg:col-span-3">
            <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-canvas/40">
              Get in touch
            </h2>

            <ul className="mt-4 space-y-3.5 text-sm">
              <li className="flex gap-3">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-blush-300" />
                <address className="not-italic text-canvas/65">
                  {BRAND.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
              <li className="flex gap-3">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-blush-300" />
                <a
                  href={`tel:${BRAND.phone.replace(/[^+\d]/g, "")}`}
                  className="text-canvas/65 transition-colors duration-300 hover:text-canvas"
                >
                  {BRAND.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-blush-300" />
                <a
                  href={`mailto:${BRAND.email}`}
                  className="break-all text-canvas/65 transition-colors duration-300 hover:text-canvas"
                >
                  {BRAND.email}
                </a>
              </li>
            </ul>

            <h2 className="mt-8 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-canvas/40">
              <ClockIcon className="h-3.5 w-3.5 text-blush-300" />
              Business hours
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {BUSINESS_HOURS.map((entry) => (
                <div
                  key={entry.days}
                  className="flex items-baseline justify-between gap-3 border-b border-canvas/10 pb-2 last:border-b-0"
                >
                  <dt className="text-canvas/50">{entry.days}</dt>
                  <dd className="shrink-0 text-canvas/80">{entry.hours}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-canvas/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-canvas/45">
            &copy; {year} {BRAND.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {["Privacy policy", "Terms of service", "Delivery policy"].map((label) => (
              <li key={label}>
                <Link
                  href="/"
                  className="text-xs text-canvas/45 transition-colors duration-300 hover:text-canvas/80"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
