import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { listAddresses } from "@/lib/customer-queries";
import { AddressManager } from "./AddressManager";

export const metadata: Metadata = {
  title: "Saved addresses",
  robots: { index: false, follow: false },
};

export default async function AccountAddressesPage() {
  const customer = await requireCustomer();
  const addresses = await listAddresses(customer.id);

  return <AddressManager addresses={addresses} />;
}
