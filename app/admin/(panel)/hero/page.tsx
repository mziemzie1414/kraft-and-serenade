import { HERO_DEFAULTS } from "@/lib/hero";
import { getHeroRecord } from "@/lib/hero-queries";
import { HeroForm } from "./HeroForm";

export default async function AdminHeroPage() {
  const record = await getHeroRecord();
  const hero = record ?? HERO_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Hero section</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The full-screen opener at the top of the home page.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the inputs pick up the
          values that were actually stored, including any new image URLs. */}
      <HeroForm
        hero={hero}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
