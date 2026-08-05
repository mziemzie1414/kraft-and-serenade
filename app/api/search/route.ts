import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Search products and categories by name. Returns at most 5 of each, ordered
 * by relevance (position then name). The query is matched case-insensitively
 * against the `name` column using Prisma's `contains` filter.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        price: true,
        imageUrl: true,
        category: { select: { name: true } },
      },
      take: 5,
    }),
    prisma.category.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        imageUrl: true,
        _count: { select: { products: true } },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json(
    { products, categories },
    { headers: { "cache-control": "no-store" } },
  );
}
