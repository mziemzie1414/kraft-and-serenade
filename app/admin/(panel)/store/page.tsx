import { getAdmin } from "@/lib/auth";
import { STORE_DEFAULTS, getStoreRecord } from "@/lib/store";
import { CredentialsForm } from "./CredentialsForm";
import { StoreForm } from "./StoreForm";

export default async function AdminStorePage() {
  const [record, admin] = await Promise.all([getStoreRecord(), getAdmin()]);
  const store = record ?? STORE_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Store settings</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Name, contact details, opening hours and manual payment. These appear in the
        footer, in page titles and at checkout.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      {/* `version` remounts the form after a save so the fields and QR preview
          show what was actually stored. */}
      <StoreForm
        store={store}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />

      <hr className="mt-10 border-canvas-deep" />

      {admin ? <CredentialsForm email={admin.email} /> : null}
    </div>
  );
}
