import Link from "next/link";
import { listCategories } from "@/lib/catalog-queries";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const [categories, count] = await Promise.all([
    listCategories(),
    // Default to the end of the list so a new product does not displace others.
    prisma.product.count(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">New product</h1>

      {categories.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-canvas-deep p-8 text-center text-sm text-ink-soft">
          Create a{" "}
          <Link
            href="/admin/categories/new"
            className="text-moss-700 underline-offset-4 hover:underline"
          >
            category
          </Link>{" "}
          first — every product needs one.
        </p>
      ) : (
        <ProductForm
          version="new"
          categories={categories}
          product={{
            id: null,
            slug: "",
            name: "",
            description: "",
            categoryId: "",
            price: "",
            compareAtPrice: "",
            imageUrl: "",
            imageAlt: "",
            rating: 5,
            reviewCount: 0,
            badge: "",
            isFeatured: false,
            bestSellerRank: "",
            position: count,
          }}
        />
      )}
    </div>
  );
}
