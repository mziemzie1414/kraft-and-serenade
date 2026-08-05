import { listCategories } from "@/lib/catalog-queries";
import { prisma } from "@/lib/prisma";
import { OccasionForm } from "../OccasionForm";

export default async function NewOccasionPage() {
  const [categories, count] = await Promise.all([
    listCategories(),
    // Default to the end of the row so a new tile does not displace others.
    prisma.occasion.count(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">New occasion</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The home page shows these six across in a row on wide screens.
      </p>

      <OccasionForm
        version="new"
        categories={categories}
        occasion={{
          id: null,
          slug: "",
          name: "",
          blurb: "",
          imageUrl: "",
          imageAlt: "",
          categoryId: "",
          position: count,
        }}
      />
    </div>
  );
}
