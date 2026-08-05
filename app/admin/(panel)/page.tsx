import Link from "next/link";
import {
  ADMIN_CATALOGUE,
  ADMIN_OPERATIONS,
  ADMIN_SECTIONS,
  ADMIN_SETTINGS,
} from "@/app/admin/sections";
import { formatPrice } from "@/lib/data";
import { getOrderSummary } from "@/lib/order-queries";

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

/**
 * One figure. `highlight` is for the counts that mean somebody has to do
 * something — an order waiting on a manual payment confirmation is work, a
 * revenue total is not.
 */
function Stat({
  label,
  value,
  href,
  highlight = false,
}: {
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <span
        className={`block font-display text-2xl font-semibold ${
          highlight ? "text-blush-600" : "text-ink"
        }`}
      >
        {value}
      </span>
      <span className="mt-0.5 block text-xs text-ink-soft">{label}</span>
    </>
  );

  const className = `block rounded-xl border p-4 ${
    highlight ? "border-blush-300 bg-blush-50" : "border-canvas-deep bg-canvas"
  }`;

  return href ? (
    <Link href={href} className={`${className} transition-shadow hover:shadow-soft`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function AdminHomePage() {
  const summary = await getOrderSummary();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-medium text-ink">Overview</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        What needs attention, and everything you can edit. Changes go live as soon as
        you save.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Awaiting payment"
          value={String(summary.awaitingPayment)}
          href="/admin/orders?status=PENDING_PAYMENT"
          // Only worth flagging when there is actually something in it.
          highlight={summary.awaitingPayment > 0}
        />
        <Stat
          label="Paid, to build"
          value={String(summary.readyToFulfil)}
          href="/admin/orders?status=PAID"
        />
        <Stat label="Placed today" value={String(summary.placedToday)} href="/admin/orders" />
        <Stat label="Paid to date" value={formatPrice(summary.revenue)} />
      </div>

      <CardList heading="Shop" items={ADMIN_OPERATIONS} />
      <CardList heading="Settings" items={ADMIN_SETTINGS} />
      <CardList heading="Catalogue" items={ADMIN_CATALOGUE} />
      <CardList heading="Page sections" items={ADMIN_SECTIONS} />
    </div>
  );
}
