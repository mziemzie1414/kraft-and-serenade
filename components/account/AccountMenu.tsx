"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { signOut } from "@/app/(site)/account/actions";
import { UserIcon } from "@/components/ui/Icons";
import { refreshAccount, useAccount } from "./useAccount";

const MENU_LINKS = [
  { label: "Your account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Saved addresses", href: "/account/addresses" },
];

/**
 * The navbar's account control.
 *
 * Signed out it is a plain link to the sign-in page, so there is no menu to open
 * for something with one destination. Signed in it opens a small menu, because
 * three links in the header would crowd out the cart and the CTA.
 *
 * `linkColor` is passed in rather than worked out here: the header is transparent
 * over the hero and solid once scrolled, and only the navbar knows which.
 */
export function AccountMenu({ linkColor }: { linkColor: string }) {
  const { status, customer } = useAccount();
  const [signingOut, startSignOut] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Which page the menu was opened on, rather than a plain boolean.
   *
   * The menu has to close when the route changes, or it is left hanging open over
   * the page that was just navigated to. Doing that in an effect means calling
   * `setState` in an effect body, which the React Compiler rejects — so instead
   * "open" is derived, and a new pathname closes it for free.
   */
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  const close = () => setOpenPath(null);

  /* Escape closes it. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /* So does a click or a focus landing outside it. */
  useEffect(() => {
    if (!open) return;

    const onInteract = (event: Event) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenPath(null);
    };

    document.addEventListener("focusin", onInteract);
    document.addEventListener("pointerdown", onInteract);

    return () => {
      document.removeEventListener("focusin", onInteract);
      document.removeEventListener("pointerdown", onInteract);
    };
  }, [open]);

  const buttonClass = `relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${linkColor}`;

  /**
   * Nothing until the session lookup lands. Rendering "Sign in" first would flash
   * the wrong state at someone who is already signed in, and the space is held so
   * the row does not shift when it arrives.
   */
  if (status === "loading") {
    return <span aria-hidden className="inline-flex h-10 w-10" />;
  }

  if (!customer) {
    return (
      <Link href="/account/login" aria-label="Sign in" className={buttonClass}>
        <UserIcon className="h-[1.15rem] w-[1.15rem]" />
      </Link>
    );
  }

  const firstName = customer.name.split(" ")[0];

  function handleSignOut() {
    startSignOut(async () => {
      await signOut();
      // The store caches who is signed in, so it has to be told before we move.
      refreshAccount();
      close();
      router.push("/");
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpenPath(open ? null : pathname)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="account-menu"
        aria-label={`Account menu for ${customer.name}`}
        className={buttonClass}
      >
        <UserIcon className="h-[1.15rem] w-[1.15rem]" />
        {/* A dot rather than initials: it reads as "signed in" at 10px, and
            initials would need a contrasting fill the transparent header cannot
            guarantee. */}
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-moss-400" />
      </button>

      <div
        id="account-menu"
        hidden={!open}
        className="absolute top-full right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-canvas-deep bg-canvas shadow-lift"
      >
        <div className="border-b border-canvas-alt px-4 py-3">
          <p className="truncate text-sm font-medium text-ink">{firstName}</p>
          <p className="truncate text-xs text-ink-faint" title={customer.email}>
            {customer.email}
          </p>
        </div>

        <ul className="py-1.5">
          {MENU_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={close}
                className="block px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-canvas-alt hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-canvas-alt px-4 py-2.5">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The same links laid flat, for the mobile drawer. A dropdown inside a drawer is
 * two overlays deep and awkward to dismiss on a phone.
 */
export function AccountDrawerLinks({ onNavigate }: { onNavigate: () => void }) {
  const { status, customer } = useAccount();
  const [signingOut, startSignOut] = useTransition();
  const router = useRouter();

  if (status === "loading") return null;

  if (!customer) {
    return (
      <li className="border-b border-canvas-alt">
        <Link
          href="/account/login"
          onClick={onNavigate}
          className="block py-3.5 font-display text-lg text-ink"
        >
          Sign in
        </Link>
      </li>
    );
  }

  return (
    <>
      {MENU_LINKS.map((link) => (
        <li key={link.href} className="border-b border-canvas-alt">
          <Link
            href={link.href}
            onClick={onNavigate}
            className="block py-3.5 font-display text-lg text-ink"
          >
            {link.label}
          </Link>
        </li>
      ))}
      <li className="border-b border-canvas-alt last:border-b-0">
        <button
          type="button"
          disabled={signingOut}
          onClick={() =>
            startSignOut(async () => {
              await signOut();
              refreshAccount();
              onNavigate();
              router.push("/");
            })
          }
          className="block w-full py-3.5 text-left font-display text-lg text-ink-soft disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </li>
    </>
  );
}
