"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/useCart";
import { ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon, BagIcon } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { categoryHref, type NavCategory } from "@/lib/nav";

type NavLink = { label: string; href: string };

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/#contact" },
  { label: "About", href: "/#about" },
];

export function Navbar({
  categories,
  storeName,
}: {
  categories: NavCategory[];
  storeName: string;
}) {
  /** The first three categories get a thumbnail in the mega-menu's promo rail. */
  const promoCategories = categories.slice(0, 3);

  // Zero on the server, then the real count once hydrated — which is why the
  // badge is only rendered when there is something in it.
  const { count: cartCount } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  const productsItemRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Swap the header from transparent (over the hero) to solid once scrolled. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Prevent the page behind the mobile drawer from scrolling. */
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  /* Escape closes whichever menu is open. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDesktopDropdownOpen(false);
      setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Close the desktop dropdown when focus or a click lands outside of it. */
  useEffect(() => {
    if (!desktopDropdownOpen) return;
    const onDocumentInteract = (event: Event) => {
      if (!productsItemRef.current?.contains(event.target as Node)) {
        setDesktopDropdownOpen(false);
      }
    };
    document.addEventListener("focusin", onDocumentInteract);
    document.addEventListener("pointerdown", onDocumentInteract);
    return () => {
      document.removeEventListener("focusin", onDocumentInteract);
      document.removeEventListener("pointerdown", onDocumentInteract);
    };
  }, [desktopDropdownOpen]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  /* These close over nothing but refs and state setters, all of which are
     stable, so they are left to the React Compiler to memoize. */

  /* A short close delay stops the menu flickering shut when the pointer
     crosses the gap between the trigger and the panel. */
  function openDropdown() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDesktopDropdownOpen(true);
  }

  function scheduleCloseDropdown() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDesktopDropdownOpen(false), 120);
  }

  function closeMobile() {
    setMobileOpen(false);
    setMobileProductsOpen(false);
  }

  /* Over the hero the header is transparent, so links need light text. */
  const onDark = !scrolled && !mobileOpen;
  const linkColor = onDark
    ? "text-canvas/90 hover:text-canvas"
    : "text-ink-soft hover:text-ink";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || mobileOpen
          ? "border-b border-canvas-deep/70 bg-canvas/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* Announcement strip */}
      <div
        className={`hidden overflow-hidden transition-all duration-500 md:block ${
          scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
        }`}
      >
        <p className="bg-moss-900 py-2 text-center text-xs tracking-wide text-canvas/80">
          Same-day delivery across Metro Manila for orders placed before 1:00 PM
        </p>
      </div>

      <nav aria-label="Main" className="container-page">
        <div className="flex h-18 items-center justify-between gap-4">
          <Logo tone={onDark ? "light" : "ink"} storeName={storeName} />

          {/* ---------- Desktop navigation ---------- */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              if (link.label !== "Products") {
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${linkColor}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li
                  key={link.label}
                  ref={productsItemRef}
                  className="relative"
                  onMouseEnter={openDropdown}
                  onMouseLeave={scheduleCloseDropdown}
                >
                  <Link
                    href={link.href}
                    aria-expanded={desktopDropdownOpen}
                    aria-haspopup="true"
                    onFocus={openDropdown}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${linkColor}`}
                  >
                    {link.label}
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${
                        desktopDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  {/* Hover dropdown. Kept mounted and animated so it can be
                      tabbed into, and hidden from AT when collapsed. */}
                  <div
                    className={`absolute top-full left-1/2 w-[45rem] -translate-x-1/2 pt-3 transition-all duration-300 ${
                      desktopDropdownOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-2 opacity-0"
                    }`}
                    hidden={!desktopDropdownOpen}
                  >
                    <div className="overflow-hidden rounded-2xl border border-canvas-deep bg-canvas shadow-lift">
                      <div className="grid grid-cols-[1.35fr_1fr]">
                        <div className="p-6">
                          <p className="mb-4 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                            Shop bouquets by type
                          </p>
                          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {categories.map((category) => (
                              <li key={category.slug}>
                                <Link
                                  href={categoryHref(category.slug)}
                                  onClick={() => setDesktopDropdownOpen(false)}
                                  className="group flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors duration-200 hover:bg-moss-50 hover:text-moss-700"
                                >
                                  <span>{category.shortName}</span>
                                  <span className="text-[0.65rem] text-ink-faint transition-colors group-hover:text-moss-400">
                                    {category.productCount}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Promo rail */}
                        <div className="border-l border-canvas-deep bg-canvas-alt/60 p-5">
                          <p className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                            Popular now
                          </p>
                          <ul className="space-y-2.5">
                            {promoCategories.map((category) => (
                              <li key={category.slug}>
                                <Link
                                  href={categoryHref(category.slug)}
                                  onClick={() => setDesktopDropdownOpen(false)}
                                  className="flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-200 hover:bg-canvas"
                                >
                                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-canvas-deep">
                                    <Image
                                      src={category.imageUrl}
                                      alt=""
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-ink">
                                      {category.shortName}
                                    </span>
                                    <span className="block truncate text-xs text-ink-faint">
                                      {category.productCount} designs
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ---------- Right-hand actions ---------- */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Search bouquets"
              className={`hidden h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 sm:inline-flex ${linkColor}`}
            >
              <SearchIcon className="h-[1.15rem] w-[1.15rem]" />
            </button>

            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${linkColor}`}
            >
              <BagIcon className="h-[1.15rem] w-[1.15rem]" />
              {/* Hidden until the cookie has been read, so the count never
                  flashes 0 on a page that was prerendered. */}
              {cartCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-[1.05rem] min-w-[1.05rem] items-center justify-center rounded-full bg-blush-500 px-1 text-[0.62rem] font-semibold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            <Link
              href="/products"
              className="ml-1 hidden rounded-full bg-moss-700 px-5 py-2.5 text-sm font-medium text-canvas transition-colors duration-300 hover:bg-moss-900 lg:inline-flex"
            >
              Order now
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 lg:hidden ${
                mobileOpen ? "text-ink" : linkColor
              }`}
            >
              {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ---------- Mobile drawer ---------- */}
      <div
        id="mobile-menu"
        hidden={!mobileOpen}
        className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-canvas-deep bg-canvas lg:hidden"
      >
        <ul className="container-page flex flex-col py-4">
          {NAV_LINKS.map((link) => {
            if (link.label !== "Products") {
              return (
                <li key={link.label} className="border-b border-canvas-alt last:border-b-0">
                  <Link
                    href={link.href}
                    onClick={closeMobile}
                    className="block py-3.5 font-display text-lg text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            }

            /* On mobile the dropdown becomes an expandable accordion. */
            return (
              <li key={link.label} className="border-b border-canvas-alt">
                <button
                  type="button"
                  onClick={() => setMobileProductsOpen((open) => !open)}
                  aria-expanded={mobileProductsOpen}
                  aria-controls="mobile-products-panel"
                  className="flex w-full items-center justify-between py-3.5 text-left font-display text-lg text-ink"
                >
                  Products
                  <ChevronDownIcon
                    className={`h-4 w-4 text-ink-soft transition-transform duration-300 ${
                      mobileProductsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  id="mobile-products-panel"
                  hidden={!mobileProductsOpen}
                  className="pb-2"
                >
                  <ul className="flex flex-col gap-0.5 border-l-2 border-blush-100 pl-3">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link
                          href={categoryHref(category.slug)}
                          onClick={closeMobile}
                          className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-sm text-ink-soft"
                        >
                          <span>{category.name}</span>
                          <span className="text-[0.7rem] text-ink-faint">
                            {category.productCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="container-page pb-6">
          <Link
            href="/products"
            onClick={closeMobile}
            className="flex w-full items-center justify-center rounded-full bg-moss-700 px-5 py-3.5 text-sm font-medium text-canvas"
          >
            Order now
          </Link>
        </div>
      </div>
    </header>
  );
}
