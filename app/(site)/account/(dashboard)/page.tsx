import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { getAccountCounts } from "@/lib/customer-queries";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const customer = await requireCustomer();
  const counts = await getAccountCounts(customer.id);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          href="/account/orders"
          value={counts.orders}
          singular="order"
          plural="orders"
          empty="No orders yet"
        />
        <SummaryCard
          href="/account/addresses"
          value={counts.addresses}
          singular="saved address"
          plural="saved addresses"
          empty="No saved addresses"
        />
      </div>

      <ProfileForm
        customer={{
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        }}
        version={customer.updatedAt.toISOString()}
      />
    </div>
  );
}

function SummaryCard({
  href,
  value,
  singular,
  plural,
  empty,
}: {
  href: string;
  value: number;
  singular: string;
  plural: string;
  empty: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-canvas-deep bg-canvas p-6 transition-colors hover:border-moss-400"
    >
      <p className="font-display text-2xl font-semibold text-ink">
        {value === 0 ? empty : value}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {value === 0 ? "Take a look" : value === 1 ? singular : plural}
      </p>
    </Link>
  );
}
