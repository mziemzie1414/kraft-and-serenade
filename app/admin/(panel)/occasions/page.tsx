import Image from "next/image";
import Link from "next/link";
import { listOccasions } from "@/lib/catalog-queries";

export default async function AdminOccasionsPage() {
  const occasions = await listOccasions();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink">Occasions</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            The &ldquo;Shop by occasion&rdquo; tiles on the home page. Each one can
            point at a category, or at the full catalogue.
          </p>
        </div>

        <Link
          href="/admin/occasions/new"
          className="rounded-full bg-moss-900 px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-moss-700"
        >
          New occasion
        </Link>
      </div>

      {occasions.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-canvas-deep p-8 text-center text-sm text-ink-soft">
          No occasions yet. The section is hidden until you add one.
        </p>
      ) : (
        <ul className="mt-8 space-y-2">
          {occasions.map((occasion) => (
            <li key={occasion.id}>
              <Link
                href={`/admin/occasions/${occasion.id}`}
                className="flex items-center gap-4 rounded-xl border border-canvas-deep bg-canvas p-3 transition-shadow hover:shadow-soft"
              >
                <Image
                  src={occasion.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  unoptimized
                />

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-medium text-ink">
                    {occasion.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-faint">
                    {occasion.blurb}
                  </span>
                </span>

                <span className="shrink-0 text-right text-xs text-ink-soft">
                  <span className="block">
                    {occasion.category ? occasion.category.name : "All bouquets"}
                  </span>
                  <span className="mt-0.5 block text-ink-faint">
                    position {occasion.position}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
