import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : "/admin";

  // Already signed in, so there is nothing to do here.
  if (await getAdmin()) redirect(target);

  const store = await getStore();

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-canvas-alt px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-canvas-deep bg-canvas p-8">
        <h1 className="font-display text-2xl font-medium text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Manage content for {store.storeName}.
        </p>

        <LoginForm next={target} />
      </div>
    </div>
  );
}
