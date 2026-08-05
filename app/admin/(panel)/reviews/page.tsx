import { REVIEWS_DEFAULTS, getReviewsRecord } from "@/lib/reviews";
import { ReviewsForm } from "./ReviewsForm";

export default async function AdminReviewsPage() {
  const record = await getReviewsRecord();
  const content = record ?? REVIEWS_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Customer reviews</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The quote cards on the home page. These are curated testimonials, not
        reviews attached to a product.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields and photo
          previews show what was actually stored. */}
      <ReviewsForm
        content={content}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
