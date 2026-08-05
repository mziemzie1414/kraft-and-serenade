import { ABOUT_DEFAULTS, ABOUT_ID, type AboutContent } from "./about";
import { prisma } from "./prisma";

/**
 * The stored About row, or `null` if it has not been created yet. The admin
 * page uses this directly because it also needs `updatedAt`.
 */
export async function getAboutRecord() {
  return prisma.aboutSection.findUnique({ where: { id: ABOUT_ID } });
}

/** Reads the live About content, falling back to the shipped defaults. */
export async function getAboutContent(): Promise<AboutContent> {
  return (await getAboutRecord()) ?? ABOUT_DEFAULTS;
}
