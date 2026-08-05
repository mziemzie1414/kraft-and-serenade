/**
 * Reads and writes for delivery dates.
 *
 * This module is the boundary where `@db.Date` values become `YYYY-MM-DD` strings
 * and back. Nothing above it should handle a `Date` for a delivery day — see the
 * note at the top of `lib/delivery.ts` for why.
 */
import {
  DELIVERY_DEFAULTS,
  DELIVERY_ID,
  parseIsoDate,
  toIsoDate,
  type DeliveryContent,
} from "./delivery";
import { prisma } from "./prisma";

/** The stored row, or `null` if it has not been created yet. */
export async function getDeliveryRecord() {
  return prisma.deliverySettings.findUnique({
    where: { id: DELIVERY_ID },
    include: { overrides: { orderBy: { date: "asc" } } },
  });
}

/**
 * The live settings, falling back to the shipped defaults.
 *
 * Exceptions in the past are filtered out rather than deleted: they cost nothing
 * to keep, a delete would need a scheduled job, and the admin calendar showing
 * last Christmas as blocked is only clutter. The cutoff is generous so the admin
 * can still look back a little.
 */
export async function getDelivery(): Promise<DeliveryContent> {
  const record = await getDeliveryRecord();

  if (!record) return { ...DELIVERY_DEFAULTS, exceptions: [] };

  return {
    isEnabled: record.isEnabled,
    rushFee: record.rushFee,
    rushWithinDays: record.rushWithinDays,
    leadTimeDays: record.leadTimeDays,
    maxAdvanceDays: record.maxAdvanceDays,
    closedWeekdays: record.closedWeekdays,
    exceptions: record.overrides.map((entry) => ({
      date: toIsoDate(entry.date),
      isOpen: entry.isOpen,
      note: entry.note,
    })),
  };
}

/** Adds or replaces the ruling for one date. */
export async function upsertDeliveryException(input: {
  date: string;
  isOpen: boolean;
  note: string | null;
}) {
  const date = parseIsoDate(input.date);

  return prisma.deliveryDateException.upsert({
    where: { date },
    create: {
      date,
      isOpen: input.isOpen,
      note: input.note,
      settingsId: DELIVERY_ID,
    },
    update: { isOpen: input.isOpen, note: input.note },
  });
}

/** Removes the ruling for one date, letting the weekday pattern apply again. */
export async function deleteDeliveryException(isoDate: string) {
  return prisma.deliveryDateException.deleteMany({
    where: { date: parseIsoDate(isoDate) },
  });
}

/**
 * How many orders are already booked for each day in a range.
 *
 * The admin calendar shows this so a day is not blocked out from under orders
 * that already exist. Cancelled orders are left out — they are not work.
 */
export async function countOrdersByDeliveryDate(
  fromIso: string,
  toIso: string,
): Promise<Record<string, number>> {
  const rows = await prisma.order.groupBy({
    by: ["deliveryDate"],
    where: {
      deliveryDate: { gte: parseIsoDate(fromIso), lte: parseIsoDate(toIso) },
      status: { not: "CANCELLED" },
    },
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};

  for (const row of rows) {
    if (!row.deliveryDate) continue;

    counts[toIsoDate(row.deliveryDate)] = row._count._all;
  }

  return counts;
}
