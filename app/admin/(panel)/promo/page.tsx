import { PROMO_DEFAULTS, getPromoRecord } from "@/lib/promo";
import { PromoForm } from "./PromoForm";

export default async function AdminPromoPage() {
  const record = await getPromoRecord();
  const promo = record ?? PROMO_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Promo banner</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The seasonal banner near the bottom of the home page.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields and image
          preview show what was actually stored. */}
      <PromoForm
        promo={promo}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
