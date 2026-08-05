import { prisma } from "./prisma";
import { SHIPPING_DEFAULTS, SHIPPING_ID, type ShippingContent } from "./shipping";

/** The stored row, or `null` if it has not been created yet. */
export async function getShippingRecord() {
  return prisma.shippingSettings.findUnique({
    where: { id: SHIPPING_ID },
    include: { rates: { orderBy: [{ scope: "asc" }, { label: "asc" }] } },
  });
}

/** Reads the live shipping configuration, falling back to the defaults. */
export async function getShipping(): Promise<ShippingContent> {
  const record = await getShippingRecord();

  if (!record) return { ...SHIPPING_DEFAULTS, rates: [] };

  return {
    isEnabled: record.isEnabled,
    flatRate: record.flatRate,
    rates: record.rates.map((rate) => ({
      id: rate.id,
      scope: rate.scope,
      psgcCode: rate.psgcCode,
      label: rate.label,
      fee: rate.fee,
    })),
  };
}
