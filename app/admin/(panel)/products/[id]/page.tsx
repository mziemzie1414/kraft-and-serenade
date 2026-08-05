import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, listCategories } from "@/lib/catalog-queries";
import { ProductForm } from "../ProductForm";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">{product.name}</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Editing a product.{" "}
        <Link
          href={`/products/${product.slug}`}
          className="text-moss-700 underline-offset-4 hover:underline"
        >
          View on the site
        </Link>
      </p>

      {/* `version` remounts the form after a save so the fields and image
          preview show what was actually stored. */}
      <ProductForm
        version={product.updatedAt.toISOString()}
        categories={categories}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? "",
          imageUrl: product.imageUrl,
          imageAlt: product.imageAlt,
          rating: product.rating,
          reviewCount: product.reviewCount,
          badge: product.badge ?? "",
          isFeatured: product.isFeatured,
          bestSellerRank: product.bestSellerRank ?? "",
          position: product.position,
        }}
      />
    </div>
  );
}
