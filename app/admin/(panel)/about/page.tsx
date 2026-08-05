import { ABOUT_DEFAULTS } from "@/lib/about";
import { getAboutRecord } from "@/lib/about-queries";
import { AboutForm } from "./AboutForm";

export default async function AdminAboutPage() {
  const record = await getAboutRecord();
  const about = record ?? ABOUT_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">About page</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The content shown on the public /about page.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      <AboutForm
        about={about}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
