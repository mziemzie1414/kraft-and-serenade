import type { Product } from "./data";
import { prisma } from "./prisma";

/** Categories in display order, each with a live count of its products. */
export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

/** Occasion tiles in display order, with the category each one leads to. */
export async function listOccasions() {
  return prisma.occasion.findMany({
    orderBy: { position: "asc" },
    include: { category: { select: { slug: true, name: true } } },
  });
}

export async function getOccasionById(id: string) {
  return prisma.occasion.findUnique({ where: { id } });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

/**
 * Products in display order, optionally narrowed to one category. Includes the
 * category so listings can show its name without a second query.
 */
export async function listProducts(options: { categoryId?: string } = {}) {
  return prisma.product.findMany({
    where: options.categoryId ? { categoryId: options.categoryId } : undefined,
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { category: true },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

/** The Featured Bouquets section, in display order. */
export async function listFeaturedProducts() {
  return prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { category: true },
  });
}

/**
 * The Best Sellers chart, top first. Rank is curated in the admin panel rather
 * than derived from orders, since there are no orders yet.
 */
export async function listBestSellers() {
  return prisma.product.findMany({
    where: { bestSellerRank: { not: null } },
    orderBy: [{ bestSellerRank: "asc" }, { name: "asc" }],
    include: { category: true },
  });
}

/**
 * Adapts a stored product to the shape `ProductCard` renders. The card predates
 * the database and is still used by the hard-coded landing sections, so the
 * mapping lives here rather than changing the component's contract.
 */
export function toProductCardData(row: {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  badge: string | null;
  category: { name: string };
}): Product {
  return {
    id: row.slug,
    name: row.name,
    category: row.category.name,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    image: row.imageUrl,
    imageAlt: row.imageAlt,
    rating: row.rating,
    reviewCount: row.reviewCount,
    badge: row.badge ?? undefined,
  };
}

/** Other designs in the same category, for the "more like this" rail. */
export async function listRelatedProducts(
  categoryId: string,
  excludeId: string,
  take = 4,
) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: excludeId } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { category: true },
    take,
  });
}
