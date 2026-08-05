import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";
import { AccountTabs } from "./AccountTabs";

/**
 * The signed-in account area.
 *
 * A route group rather than a plain folder so `/account/login` and
 * `/account/register` sit outside it — sharing this layout would have them
 * redirect to themselves, the same reason the admin login page lives outside
 * `(panel)`.
 */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  /**
   * `proxy.ts` already turned anonymous browsers away, but it only checks that a
   * cookie exists. This is where the session is validated, so an expired or forged
   * cookie cannot render the page. Every action behind it calls
   * `requireCustomer()` as well, because a Server Action never loads this layout.
   */
  const customer = await getCustomer();

  if (!customer) redirect("/account/login");

  return (
    <>
      {/* Dark band so the fixed header, which starts transparent, stays legible
          before the page is scrolled. */}
      <header className="bg-moss-900 pt-32 pb-12 sm:pt-36">
        <div className="container-page">
          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-canvas sm:text-4xl">
            Your account
          </h1>
          <p className="mt-3 text-sm text-canvas/70">
            Signed in as {customer.email}
          </p>
        </div>
      </header>

      <section className="bg-canvas py-10 sm:py-14">
        <div className="container-page space-y-8">
          <AccountTabs />
          {children}
        </div>
      </section>
    </>
  );
}
