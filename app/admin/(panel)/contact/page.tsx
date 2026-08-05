import { CONTACT_DEFAULTS } from "@/lib/contact";
import { getContactRecord } from "@/lib/contact-queries";
import { ContactForm } from "./ContactForm";

export default async function AdminContactPage() {
  const record = await getContactRecord();
  const contact = record ?? CONTACT_DEFAULTS;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-medium text-ink">Contact page</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        The content shown on the public /contact page. The actual email address
        visitors see comes from the <code>CONTACT_TO_EMAIL</code> environment
        variable, not from here.
        {record ? null : " Showing the built-in defaults — nothing saved yet."}
      </p>

      <ContactForm
        contact={contact}
        version={record ? record.updatedAt.toISOString() : "defaults"}
      />
    </div>
  );
}
