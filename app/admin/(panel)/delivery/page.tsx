import { formatPrice } from "@/lib/data";
import { addDays, todayInShopZone, WEEKDAY_NAMES } from "@/lib/delivery";
import {
  countOrdersByDeliveryDate,
  getDelivery,
  getDeliveryRecord,
} from "@/lib/delivery-queries";
import { DeliveryForm } from "./DeliveryForm";

export default async function AdminDeliveryPage() {
  /**
   * "Today" is worked out on the server in the shop's timezone and passed down, so
   * the admin's own device clock — or a browser in another country — cannot shift
   * which dates the calendar treats as past.
   */
  const today = todayInShopZone();

  const [record, delivery] = await Promise.all([
    getDeliveryRecord(),
    getDelivery(),
  ]);

  // A year is enough for the calendar to page through without loading everything.
  const orderCounts = await countOrdersByDeliveryDate(today, addDays(today, 365));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">
        Delivery dates
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Which days customers can choose at checkout, and what a last-minute order
        costs.{" "}
        {delivery.isEnabled ? (
          <>
            Currently asking for a date
            {delivery.rushFee > 0 ? (
              <>
                {" "}
                and charging {formatPrice(delivery.rushFee)} within{" "}
                {delivery.rushWithinDays + 1}{" "}
                {delivery.rushWithinDays === 0 ? "day" : "days"}
              </>
            ) : (
              " with no rush fee"
            )}
            {delivery.closedWeekdays.length > 0 ? (
              <>
                , closed{" "}
                {delivery.closedWeekdays
                  .map((day) => `${WEEKDAY_NAMES[day]}s`)
                  .join(" and ")}
              </>
            ) : null}
          </>
        ) : (
          <strong className="text-ink">not asking for a delivery date</strong>
        )}
        .{record ? null : " Nothing saved yet, so these are starting values."}
      </p>

      {/* `version` remounts the form after a save so the fields reflect what was
          actually stored. */}
      <DeliveryForm
        delivery={delivery}
        today={today}
        orderCounts={orderCounts}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
