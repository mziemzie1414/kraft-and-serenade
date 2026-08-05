/**
 * Shipping configuration and fee resolution.
 *
 * Kept free of database imports so the checkout form can compute the fee as the
 * customer picks their address, with no round trip. Reads live in
 * `lib/shipping-queries.ts`.
 */

/** One row, addressed by a fixed id. */
export const SHIPPING_ID = "shipping";

export type ShippingRateRow = {
  id: string;
  scope: "REGION" | "CITY";
  psgcCode: string;
  label: string;
  fee: number;
};

export type ShippingContent = {
  isEnabled: boolean;
  flatRate: number;
  rates: ShippingRateRow[];
};

/**
 * Nothing in the original site charged for delivery, so the flat rate is a
 * starting figure rather than migrated content. Set the real one in
 * /admin/shipping.
 */
export const SHIPPING_DEFAULTS: Omit<ShippingContent, "rates"> = {
  isEnabled: true,
  flatRate: 150,
};

export type ShippingBasis = "DISABLED" | "CITY" | "REGION" | "FLAT";

export type ResolvedShipping = {
  fee: number;
  /** Which rule produced the fee, for display and for storing on the order. */
  basis: ShippingBasis;
  label: string;
};

/**
 * Works out the delivery charge for an address.
 *
 * A city rate wins over a region rate, and the flat rate is the fallback. That
 * order is the whole point of the table: a region can be priced broadly and then
 * individual cities corrected without unpicking anything.
 *
 * The checkout form calls this for the live figure and the order action calls it
 * again on the server, so the customer is never charged a fee the browser
 * proposed.
 */
export function resolveShippingFee(
  shipping: ShippingContent,
  location: { regionCode: string; cityCode: string },
): ResolvedShipping {
  if (!shipping.isEnabled) {
    return { fee: 0, basis: "DISABLED", label: "Delivery not charged" };
  }

  const city = shipping.rates.find(
    (rate) => rate.scope === "CITY" && rate.psgcCode === location.cityCode,
  );

  if (city) return { fee: city.fee, basis: "CITY", label: city.label };

  const region = shipping.rates.find(
    (rate) => rate.scope === "REGION" && rate.psgcCode === location.regionCode,
  );

  if (region) return { fee: region.fee, basis: "REGION", label: region.label };

  return { fee: shipping.flatRate, basis: "FLAT", label: "Standard delivery" };
}
