import { cookies } from "next/headers";
import { CART_COOKIE, decodeCart, type CartLine } from "./cart";
import { prisma } from "./prisma";

/** The cart as the browser sent it, before anything is checked against the database. */
export async function readCartCookie(): Promise<CartLine[]> {
  const store = await cookies();

  return decodeCart(store.get(CART_COOKIE)?.value);
}

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string;
  imageAlt: string;
  /** Whole pesos, from the database — never from the cookie. */
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
};

export type HydratedCart = {
  items: CartItem[];
  subtotal: number;
  /** Total number of individual bouquets, not lines. */
  count: number;
  /**
   * True when the cookie referred to products that no longer exist. The caller
   * decides how loudly to say so.
   */
  droppedMissing: boolean;
};

/**
 * Turns cookie lines into real line items, pricing everything from the database.
 *
 * This is the only place a cart total is calculated, and it is used both to
 * render the cart and to price an order at checkout — so what the customer is
 * shown and what they are charged cannot drift apart.
 */
export async function hydrateCart(lines: CartLine[]): Promise<HydratedCart> {
  if (lines.length === 0) {
    return { items: [], subtotal: 0, count: 0, droppedMissing: false };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((line) => line.productId) } },
    include: { category: { select: { name: true } } },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  // Cookie order is preserved so the list does not reshuffle as it is edited.
  const items: CartItem[] = [];

  for (const line of lines) {
    const product = byId.get(line.productId);

    if (!product) continue;

    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      categoryName: product.category.name,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: line.quantity,
      lineTotal: product.price * line.quantity,
    });
  }

  return {
    items,
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
    count: items.reduce((total, item) => total + item.quantity, 0),
    droppedMissing: items.length < lines.length,
  };
}

/** Convenience for server code that just wants the current cart. */
export async function getCart(): Promise<HydratedCart> {
  return hydrateCart(await readCartCookie());
}
