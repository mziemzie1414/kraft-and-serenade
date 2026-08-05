import { formatPrice } from "@/lib/data";
import { getShipping, getShippingRecord } from "@/lib/shipping-queries";
import { ShippingForm } from "./ShippingForm";

export default async function AdminShippingPage() {
  const [record, shipping] = await Promise.all([
    getShippingRecord(),
    getShipping(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Shipping</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        What delivery costs, by location. Currently{" "}
        {shipping.isEnabled ? (
          <>
            charging {formatPrice(shipping.flatRate)} as standard with{" "}
            {shipping.rates.length}{" "}
            {shipping.rates.length === 1 ? "exception" : "exceptions"}
          </>
        ) : (
          <strong className="text-ink">not charging for delivery</strong>
        )}
        .{record ? null : " Nothing saved yet, so these are starting values."}
      </p>

      {/* `version` remounts the form after a save so the rate list reflects what
          was actually stored. */}
      <ShippingForm
        shipping={shipping}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
