/**
 * Reads for the customer account pages. Every function takes the customer id
 * explicitly and scopes the query to it, so an id from anywhere but
 * `requireCustomer()` cannot widen what comes back.
 */
import type { SavedAddress } from "./customer";
import { prisma } from "./prisma";

/** Saved addresses, default first, then most recently added. */
export async function listAddresses(customerId: string): Promise<SavedAddress[]> {
  const rows = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    regionCode: row.regionCode,
    regionName: row.regionName,
    provinceCode: row.provinceCode,
    provinceName: row.provinceName,
    cityCode: row.cityCode,
    cityName: row.cityName,
    barangay: row.barangay,
    street: row.street,
    postalCode: row.postalCode,
    deliveryNotes: row.deliveryNotes,
    isDefault: row.isDefault,
  }));
}

/** One saved address, or `null` if it is not this customer's. */
export async function getAddress(customerId: string, addressId: string) {
  return prisma.customerAddress.findFirst({
    where: { id: addressId, customerId },
  });
}

/**
 * The customer's order history, newest first.
 *
 * `accessToken` comes back because each row links to `/orders/<token>` — the
 * confirmation page is the receipt, and there is no second copy of it to build.
 */
export async function listCustomerOrders(customerId: string, take = 50) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      orderNumber: true,
      accessToken: true,
      status: true,
      total: true,
      createdAt: true,
      items: {
        select: { id: true, productName: true, imageUrl: true, quantity: true },
      },
    },
  });
}

/** The address fields an order and a saved address have in common. */
export type AddressFields = {
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  barangay: string;
  street: string;
  postalCode: string;
  deliveryNotes: string | null;
};

/**
 * Files the address an order was just delivered to against the customer's account.
 *
 * Skips an address already on file, keyed on street, barangay and city. Without
 * that, ordering to the same place three times leaves three identical entries in
 * the checkout picker.
 *
 * The first address saved becomes the default, because there is nothing else for
 * checkout to preselect.
 *
 * Returns what it did, so the caller — and a test — can tell a save from a skip.
 */
export async function saveOrderAddress(
  customerId: string,
  address: AddressFields,
): Promise<"saved" | "skipped-duplicate"> {
  const duplicate = await prisma.customerAddress.findFirst({
    where: {
      customerId,
      cityCode: address.cityCode,
      barangay: address.barangay,
      street: address.street,
    },
    select: { id: true },
  });

  if (duplicate) return "skipped-duplicate";

  const existingCount = await prisma.customerAddress.count({ where: { customerId } });

  await prisma.customerAddress.create({
    data: { ...address, customerId, isDefault: existingCount === 0 },
  });

  return "saved";
}

/** How many orders and addresses the account has, for the overview page. */
export async function getAccountCounts(customerId: string) {
  const [orders, addresses] = await Promise.all([
    prisma.order.count({ where: { customerId } }),
    prisma.customerAddress.count({ where: { customerId } }),
  ]);

  return { orders, addresses };
}
