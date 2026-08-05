"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  THEME_DEFAULTS,
  THEME_ID,
  THEME_TOKENS,
  isHexColor,
  type ThemeContent,
} from "@/lib/theme";

import type { AdminFormState } from "../form-state";

async function write(theme: ThemeContent) {
  await prisma.theme.upsert({
    where: { id: THEME_ID },
    create: { id: THEME_ID, ...theme },
    update: theme,
  });

  // The palette lives in the root layout, so every prerendered page under it
  // has to be regenerated, not just `/`.
  revalidatePath("/", "layout");
}

export async function saveTheme(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    // The "Reset" button submits the same form with a different intent, so both
    // paths share one action and one status message.
    if (formData.get("intent") === "reset") {
      await write(THEME_DEFAULTS);
      return { status: "saved", message: "Palette reset to the original colours." };
    }

    const theme = {} as ThemeContent;

    for (const token of THEME_TOKENS) {
      const raw = formData.get(token.key);
      const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";

      if (!isHexColor(value)) {
        throw new Error(
          `${token.label} must be a hex colour like #1e2b24, got "${value}".`,
        );
      }

      theme[token.key] = value;
    }

    await write(theme);

    return { status: "saved", message: "Palette updated." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}
