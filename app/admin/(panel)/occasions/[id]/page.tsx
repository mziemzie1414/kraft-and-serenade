import { notFound } from "next/navigation";
import { getOccasionById, listCategories } from "@/lib/catalog-queries";
import { OccasionForm } from "../OccasionForm";

export default async function EditOccasionPage({
  params,
}: PageProps<"/admin/occasions/[id]">) {
  const { id } = await params;
  const [occasion, categories] = await Promise.all([
    getOccasionById(id),
    listCategories(),
  ]);

  if (!occasion) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">{occasion.name}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Editing an occasion tile.
      </p>

      {/* `version` remounts the form after a save so the fields and image
          preview show what was actually stored. */}
      <OccasionForm
        version={occasion.updatedAt.toISOString()}
        categories={categories}
        occasion={{
          id: occasion.id,
          slug: occasion.slug,
          name: occasion.name,
          blurb: occasion.blurb,
          imageUrl: occasion.imageUrl,
          imageAlt: occasion.imageAlt,
          categoryId: occasion.categoryId ?? "",
          position: occasion.position,
        }}
      />
    </div>
  );
}
