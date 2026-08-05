import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/catalog-queries";
import { CategoryForm } from "../CategoryForm";

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  const category = await getCategoryById(id);

  if (!category) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">{category.name}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Editing a category.{" "}
        <Link
          href={`/products?category=${category.slug}`}
          className="text-moss-700 underline-offset-4 hover:underline"
        >
          View on the site
        </Link>
      </p>

      {/* `version` remounts the form after a save so the fields and image
          preview show what was actually stored. */}
      <CategoryForm
        version={category.updatedAt.toISOString()}
        category={{
          id: category.id,
          slug: category.slug,
          name: category.name,
          shortName: category.shortName,
          description: category.description,
          imageUrl: category.imageUrl,
          imageAlt: category.imageAlt,
          position: category.position,
        }}
      />
    </div>
  );
}
