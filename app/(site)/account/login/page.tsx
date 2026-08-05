import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";
import { safeAccountNext } from "../next-path";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AccountLoginPage({
  searchParams,
}: PageProps<"/account/login">) {
  const { next } = await searchParams;
  const target = safeAccountNext(next);

  // Already signed in, so there is nothing to do here.
  if (await getCustomer()) redirect(target);

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-12 sm:pt-36">
        <div className="container-page">
          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-canvas sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-3 text-sm text-canvas/70">
            For your saved addresses and past orders. You never need an account to
            place one.
          </p>
        </div>
      </header>

      <section className="bg-canvas py-12 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-md rounded-2xl border border-canvas-deep bg-canvas-alt p-6 sm:p-8">
            <SignInForm next={target} />

            <p className="mt-6 border-t border-canvas-deep pt-5 text-sm text-ink-soft">
              No account yet?{" "}
              <Link
                href="/account/register"
                className="font-semibold text-moss-700 underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
