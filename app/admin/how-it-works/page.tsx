import { HOW_IT_WORKS_DEFAULTS, getHowItWorksRecord } from "@/lib/how-it-works";
import { HowItWorksForm } from "./HowItWorksForm";

export default async function AdminHowItWorksPage() {
  const record = await getHowItWorksRecord();
  const content = record ?? HOW_IT_WORKS_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">How it works</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The numbered steps and the callout panel on the home page.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields show what was
          actually stored. */}
      <HowItWorksForm
        content={content}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
