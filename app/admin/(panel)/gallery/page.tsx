import { GALLERY_DEFAULTS, getGalleryRecord } from "@/lib/gallery";
import { GalleryForm } from "./GalleryForm";

export default async function AdminGalleryPage() {
  const record = await getGalleryRecord();
  const content = record ?? GALLERY_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Studio gallery</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The photo grid on the home page. Tiles without a link render as plain
        images rather than links that go nowhere.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields and image
          previews show what was actually stored. */}
      <GalleryForm
        content={content}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
