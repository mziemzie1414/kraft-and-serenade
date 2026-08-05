import { CONTACT_DEFAULTS, CONTACT_ID, type ContactContent } from "./contact";
import { prisma } from "./prisma";

/**
 * The stored Contact row, or `null` if it has not been created yet. The admin
 * page uses this directly because it also needs `updatedAt`.
 */
export async function getContactRecord() {
  return prisma.contactSection.findUnique({ where: { id: CONTACT_ID } });
}

/** Reads the live Contact content, falling back to the shipped defaults. */
export async function getContactContent(): Promise<ContactContent> {
  return (await getContactRecord()) ?? CONTACT_DEFAULTS;
}
