import { THEME_DEFAULTS } from "@/lib/theme";
import { getThemeRecord } from "@/lib/theme-queries";
import { ThemeForm } from "./ThemeForm";

export default async function AdminThemePage() {
  const record = await getThemeRecord();
  const theme = record ?? THEME_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Colours</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The palette used across the whole site. Every shade is applied wherever it
        appears, including tinted overlays and gradients.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the swatches and hex
          fields show what was actually stored. */}
      <ThemeForm
        theme={theme}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
