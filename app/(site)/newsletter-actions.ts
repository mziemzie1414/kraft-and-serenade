"use server";

import { isEmail, normaliseEmail } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export type SubscribeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Stores an email address. Nothing is sent to it — see `lib/newsletter.ts`.
 *
 * Re-subscribing an existing address succeeds silently rather than reporting
 * "already subscribed", which would turn the form into a way to check whether a
 * given person is on the list.
 */
export async function subscribe(
  _prevState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = normaliseEmail(String(formData.get("email") ?? ""));

  if (!isEmail(email)) {
    return {
      status: "error",
      message: "That email does not look right. Mind checking it?",
    };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: {},
    });
  } catch {
    return {
      status: "error",
      message: "We could not save that just now. Please try again.",
    };
  }

  return {
    status: "success",
    message: "You are on the list. Look out for Friday's email.",
  };
}
