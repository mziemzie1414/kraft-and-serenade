import Image from "next/image";
import { REVIEWS } from "@/lib/data";
import { Rating } from "@/components/ui/Rating";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CustomerReviews() {
  return (
    <section id="reviews" className="scroll-mt-24 bg-canvas py-20 sm:py-24 lg:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Customer reviews"
          title="What people actually said"
          lede="Pulled from verified order confirmations. We publish the four-star ones too."
        />

        {/* Masonry-ish columns on desktop so quotes of different lengths sit
            tightly without stretching each card to a shared height. */}
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review, index) => (
            <li
              key={review.id}
              className={index === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}
            >
              <figure className="flex h-full flex-col rounded-2xl border border-canvas-deep bg-white p-6 transition-shadow duration-500 hover:shadow-soft">
                <Rating value={review.rating} size="md" showValue={false} />

                <blockquote className="mt-4 flex-1">
                  <p className="font-display text-base leading-relaxed text-ink text-pretty">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-canvas-alt pt-5">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-canvas-deep">
                    <Image
                      src={review.avatar}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {review.name}
                    </span>
                    <span className="block truncate text-xs text-ink-faint">
                      {review.location} &middot; {review.purchased}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
