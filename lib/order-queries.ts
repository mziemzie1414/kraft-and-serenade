/**
 * Reads for the admin orders screens.
 *
 * Separate from `lib/orders.ts`, which owns order numbers, access tokens and the
 * status vocabulary. This module is only queries.
 *
 * Unlike `lib/customer-queries.ts`, nothing here is scoped to an owner: an admin
 * sees every order by definition. Authorisation is `requireAdmin()` in the pages
 * and actions that call these.
 */
import { randomBytes } from "node:crypto";
import type { OrderStatus } from "./orders";
import { prisma } from "./prisma";

/** Rows per page on `/admin/orders`. */
export const ORDERS_PAGE_SIZE = 20;

/* ------------------------------------------------- identifiers for a new order */

/**
 * Alphabet for order numbers, minus the characters people misread when reading
 * one out or typing it from a screenshot: I, L, O, U, 0, 1.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[bytes[index] % ALPHABET.length];
  }

  return code;
}

function datePart(now: Date): string {
  const year = String(now.getUTCFullYear()).slice(2);
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

/**
 * A short, readable order number, e.g. `KS-260805-K7F3`.
 *
 * Customers quote this to the store when paying manually, so it has to survive
 * being read aloud. The date makes it easy for the admin to place, and the random
 * tail keeps same-day orders apart. Collisions are checked rather than assumed —
 * which is why this lives with the queries rather than in the pure module.
 */
export async function generateOrderNumber(): Promise<string> {
  const prefix = `KS-${datePart(new Date())}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    // Widen the tail if the short form keeps colliding.
    const candidate = `${prefix}-${randomCode(attempt < 5 ? 4 : 6)}`;
    const clash = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });

    if (!clash) return candidate;
  }

  throw new Error("Could not allocate an order number. Please try again.");
}

/** The token the confirmation URL is keyed on. Unguessable, unlike the number. */
export function generateAccessToken(): string {
  return randomBytes(24).toString("hex");
}

/**
 * Loads an order from its confirmation token, with whether its payment code has
 * lapsed already worked out.
 *
 * The expiry check lives here rather than in the page because reading the clock
 * during render is impure — and because how fresh a payment code is belongs with
 * the data, not the markup.
 */
export async function getOrderByToken(token: string) {
  const order = await prisma.order.findUnique({
    where: { accessToken: token },
    include: { items: true },
  });

  if (!order) return null;

  return {
    ...order,
    qrExpired: order.qrExpiresAt
      ? order.qrExpiresAt.getTime() < Date.now()
      : false,
  };
}

/* ------------------------------------------------------------ admin listings */

export type OrderListFilters = {
  /** `undefined` means every status. */
  status?: OrderStatus;
  /** Matches the order number, or a customer's name, email or phone. */
  query?: string;
  /** One-based. */
  page?: number;
};

/**
 * Builds the `where` clause both the page query and the count share, so the
 * total can never disagree with the rows it is counting.
 */
function buildWhere(filters: OrderListFilters) {
  const query = filters.query?.trim();

  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(query
      ? {
          OR: [
            // Order numbers are quoted by customers, often in the wrong case.
            { orderNumber: { contains: query, mode: "insensitive" as const } },
            { customerName: { contains: query, mode: "insensitive" as const } },
            { customerEmail: { contains: query, mode: "insensitive" as const } },
            { customerPhone: { contains: query } },
          ],
        }
      : {}),
  };
}

/**
 * One page of orders, newest first.
 *
 * Offset pagination rather than a cursor: the admin needs to jump to page 4 and
 * see a total, and a florist's order table will not reach the depth where
 * `OFFSET` starts to hurt.
 */
export async function listOrders(filters: OrderListFilters = {}) {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const where = buildWhere(filters);

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        total: true,
        createdAt: true,
        paidAt: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        cityName: true,
        /** Non-null means the order was placed by a signed-in account. */
        customerId: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));

  return { rows, total, page: Math.min(page, pageCount), pageCount };
}

/** One order in full, or `null`. Keyed on the id, since only an admin reaches this. */
export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * How many orders sit in each status.
 *
 * One `groupBy` rather than four counts, and the result is filled out to cover
 * every status so the filter tabs can show a zero instead of vanishing.
 */
export async function countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
  const grouped = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<OrderStatus, number> = {
    PENDING_PAYMENT: 0,
    PAID: 0,
    FULFILLED: 0,
    CANCELLED: 0,
  };

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  return counts;
}

/** Totals for the admin dashboard: what needs attention, and today's takings. */
export async function getOrderSummary() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [awaitingPayment, readyToFulfil, placedToday, paidTotal] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "FULFILLED"] } },
      _sum: { total: true },
    }),
  ]);

  return {
    awaitingPayment,
    readyToFulfil,
    placedToday,
    /** Whole pesos across paid and fulfilled orders. Never null. */
    revenue: paidTotal._sum.total ?? 0,
  };
}
