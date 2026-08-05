import { prisma } from "./prisma";
import { THEME_DEFAULTS, THEME_ID, type ThemeContent } from "./theme";

/**
 * The stored palette, or `null` if it has not been created yet. The admin page
 * uses this directly because it also needs `updatedAt`.
 */
export async function getThemeRecord() {
  return prisma.theme.findUnique({ where: { id: THEME_ID } });
}

/** Reads the live palette, falling back to the shipped defaults. */
export async function getThemeContent(): Promise<ThemeContent> {
  return (await getThemeRecord()) ?? THEME_DEFAULTS;
}
