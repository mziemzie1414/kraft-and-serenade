import type { Metadata } from "next";
import { getContactContent } from "@/lib/contact-queries";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with Kraft & Serenade. Questions about orders, custom arrangements or anything else — we are happy to help.",
};

export default async function ContactPage() {
  const contact = await getContactContent();
  const email = process.env.CONTACT_TO_EMAIL ?? "hello@kraftandserenade.com";

  return (
    <>
      <header className="bg-moss-900 pt-32 pb-14 sm:pt-36">
        <div className="container-page">
          <p className="mb-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.24em] text-blush-300 uppercase">
            <span className="h-px w-6 bg-blush-300/60" aria-hidden />
            {contact.eyebrow}
          </p>

          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance text-canvas sm:text-4xl lg:text-5xl">
            {contact.title}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-canvas/70">
            {contact.body}
          </p>
        </div>
      </header>

      <section className="bg-canvas py-14 sm:py-16 lg:py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Contact details */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-xl font-medium text-ink">
                  Reach us directly
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Drop us a message or visit the studio. We usually respond
                  within a few hours during business days.
                </p>
              </div>

              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moss-50 text-moss-700">
                    <MailIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Email
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="mt-0.5 text-sm text-ink hover:text-moss-700"
                    >
                      {email}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moss-50 text-moss-700">
                    <PhoneIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Phone
                    </p>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="mt-0.5 text-sm text-ink hover:text-moss-700"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moss-50 text-moss-700">
                    <MapPinIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Studio address
                    </p>
                    <p className="mt-0.5 text-sm text-ink">
                      {contact.address}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Contact form */}
            <div className="rounded-2xl border border-canvas-deep bg-canvas-alt/40 p-6 sm:p-8">
              <h2 className="font-display text-xl font-medium text-ink">
                Send us a message
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                We will get back to you as soon as we can.
              </p>

              <form
                action={`mailto:${email}`}
                method="GET"
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold uppercase tracking-wide text-ink-soft"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    name="subject"
                    type="text"
                    required
                    placeholder="Your name"
                    className="mt-1.5 w-full rounded-lg border border-canvas-deep bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold uppercase tracking-wide text-ink-soft"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="body"
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className="mt-1.5 w-full resize-y rounded-lg border border-canvas-deep bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-moss-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-moss-700 px-5 py-3 text-sm font-medium text-canvas transition-colors hover:bg-moss-900"
                >
                  Send message
                </button>
              </form>
            </div>
          </div>

          {/* Optional map embed */}
          {contact.mapEmbedUrl && (
            <div className="mt-14 overflow-hidden rounded-2xl border border-canvas-deep">
              <iframe
                src={contact.mapEmbedUrl}
                title="Studio location"
                className="h-72 w-full sm:h-80 lg:h-96"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
