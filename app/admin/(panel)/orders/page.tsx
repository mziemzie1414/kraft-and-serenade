import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { countOrdersByStatus, listOrders } from "@/lib/order-queries";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/orders";
import { StatusBadge, formatOrderDate } from "./ui";

/** Rebuilds the current URL with one parameter changed. Blanks are dropped. */
function ordersHref(params: {
  status?: OrderStatus | "all";
  q?: string;
  page?: number;
}): string {
  const search = new URLSearchParams();

  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();

  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const { status: rawStatus, q: rawQuery, page: rawPage } = await searchParams;

  const status =
    typeof rawStatus === "string" && isOrderStatus(rawStatus) ? rawStatus : undefined;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const requestedPage = Number(typeof rawPage === "string" ? rawPage : 1);

  const [counts, result] = await Promise.all([
    countOrdersByStatus(),
    listOrders({
      status,
      query,
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
    }),
  ]);

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-medium text-ink">Orders</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Every order placed, newest first. Manual payments are confirmed here.
        </p>
      </div>

      {/* Status filter. Plain links, so this needs no client JavaScript. */}
      <nav aria-label="Filter by status" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={ordersHref({ status: "all", q: query })}
              aria-current={status ? undefined : "page"}
              className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                status
                  ? "border-canvas-deep text-ink-soft hover:border-ink-faint hover:text-ink"
                  : "border-moss-900 bg-moss-900 text-canvas"
              }`}
            >
              All <span className="text-[0.65rem] opacity-70">{total}</span>
            </Link>
          </li>
          {ORDER_STATUSES.map((value) => {
            const active = status === value;

            return (
              <li key={value}>
                <Link
                  href={ordersHref({ status: value, q: query })}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-moss-900 bg-moss-900 text-canvas"
                      : "border-canvas-deep text-ink-soft hover:border-ink-faint hover:text-ink"
                  }`}
                >
                  {ORDER_STATUS_LABELS[value]}{" "}
                  <span className="text-[0.65rem] opacity-70">{counts[value]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* A GET form, so searching is a normal navigation and the URL stays shareable. */}
      <form method="get" action="/admin/orders" className="mt-4 flex flex-wrap gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label htmlFor="q" className="sr-only">
          Search orders
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Order number, name, email or phone"
          className="min-w-0 flex-1 rounded-lg border border-canvas-deep bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-moss-900 px-5 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
        >
          Search
        </button>
        {query ? (
          <Link
            href={ordersHref({ status: status ?? "all" })}
            className="rounded-full border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {result.rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-canvas-deep p-8 text-center text-sm text-ink-soft">
          {query
            ? `Nothing matches “${query}”.`
            : status
              ? `No ${ORDER_STATUS_LABELS[status].toLowerCase()} orders.`
              : "No orders yet."}
        </p>
      ) : (
        <>
          <p className="mt-6 text-xs text-ink-faint">
            {result.total} order{result.total === 1 ? "" : "s"}
            {result.pageCount > 1
              ? ` · page ${result.page} of ${result.pageCount}`
              : ""}
          </p>

          <ul className="mt-2 space-y-2">
            {result.rows.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-xl border border-canvas-deep bg-canvas p-4 transition-shadow hover:shadow-soft"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-medium tracking-wide text-ink">
                      {order.orderNumber}
                    </span>
                    <StatusBadge status={order.status} />
                    {order.customerId ? (
                      <span className="rounded-full bg-moss-100 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-moss-700 uppercase">
                        Account
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="min-w-0 text-xs text-ink-soft">
                      <span className="font-medium text-ink">
                        {order.customerName}
                      </span>
                      {" · "}
                      {order.cityName}
                      {" · "}
                      {order._count.items} item
                      {order._count.items === 1 ? "" : "s"}
                      <span className="mt-0.5 block text-ink-faint">
                        {/* The delivery date leads, because that is what the week
                            is planned around; when it was placed is secondary. */}
                        {order.deliveryDate ? (
                          <>
                            <span
                              className={
                                order.rushFee > 0
                                  ? "font-semibold text-blush-600"
                                  : "font-medium text-ink-soft"
                              }
                            >
                              For {formatOrderDate(order.deliveryDate)}
                              {order.rushFee > 0 ? " · rush" : ""}
                            </span>
                            {" · "}
                          </>
                        ) : null}
                        placed {formatOrderDate(order.createdAt)} ·{" "}
                        {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                      </span>
                    </span>

                    <span className="shrink-0 font-display text-base font-semibold text-ink">
                      {formatPrice(order.total)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {result.pageCount > 1 ? (
            <nav
              aria-label="Pages"
              className="mt-6 flex items-center justify-between gap-4"
            >
              {result.page > 1 ? (
                <Link
                  href={ordersHref({
                    status: status ?? "all",
                    q: query,
                    page: result.page - 1,
                  })}
                  className="rounded-full border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}

              {result.page < result.pageCount ? (
                <Link
                  href={ordersHref({
                    status: status ?? "all",
                    q: query,
                    page: result.page + 1,
                  })}
                  className="rounded-full border border-canvas-deep px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
