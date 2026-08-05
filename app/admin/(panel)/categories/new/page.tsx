import { prisma } from "@/lib/prisma";
import { CategoryForm } from "../CategoryForm";

export default async function NewCategoryPage() {
  // Default to the end of the list so a new category does not displace others.
  const count = await prisma.category.count();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">New category</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Products are assigned to a category, so this comes first.
      </p>

      <CategoryForm
        version="new"
        category={{
          id: null,
          slug: "",
          name: "",
          shortName: "",
          description: "",
          imageUrl: "",
          imageAlt: "",
          position: count,
        }}
      />
    </div>
  );
}
