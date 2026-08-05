import Link from "next/link";
import { FAQ_DEFAULTS, getFaqRecord } from "@/lib/faq";
import { FaqsForm } from "./FaqsForm";

export default async function AdminFaqsPage() {
  const record = await getFaqRecord();
  const content = record ?? FAQ_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">FAQs</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        One place for both the home page block and the{" "}
        <Link href="/faqs" className="text-moss-700 underline-offset-4 hover:underline">
          FAQ page
        </Link>
        .{record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields show what was
          actually stored. */}
      <FaqsForm
        content={content}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
