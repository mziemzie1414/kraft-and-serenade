import { WHY_CHOOSE_US_DEFAULTS, getWhyChooseUsRecord } from "@/lib/why-choose-us";
import { WhyChooseUsForm } from "./WhyChooseUsForm";

export default async function AdminWhyChooseUsPage() {
  const record = await getWhyChooseUsRecord();
  const content = record ?? WHY_CHOOSE_US_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Why choose us</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The studio photographs, selling points and stat strip on the home page.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields and image
          previews show what was actually stored. */}
      <WhyChooseUsForm
        content={content}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
