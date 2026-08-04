import { StarIcon } from "./Icons";

/**
 * Accessible star rating. The stars are decorative; the value is announced
 * through the wrapper's aria-label so screen readers hear it once, not five times.
 */
export function Rating({
  value,
  reviewCount,
  size = "sm",
  showValue = true,
}: {
  value: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showValue?: boolean;
}) {
  const starSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const rounded = Math.round(value);

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={
        reviewCount
          ? `Rated ${value} out of 5 from ${reviewCount} reviews`
          : `Rated ${value} out of 5`
      }
    >
      <div className="flex items-center gap-0.5 text-gold">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= rounded} className={starSize} />
        ))}
      </div>
      {showValue ? (
        <span className="text-xs font-medium text-ink-soft">
          {value.toFixed(1)}
          {reviewCount ? (
            <span className="text-ink-faint"> ({reviewCount})</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
