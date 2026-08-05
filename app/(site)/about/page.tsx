import type { Metadata } from "next";
import Image from "next/image";
import { getAboutContent } from "@/lib/about-queries";

export const metadata: Metadata = {
  title: "About us",
  description:
    "The story behind Kraft & Serenade — a small Pasig City florist studio making hand-tied bouquets for the moments that matter.",
};

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <>
      <header className="bg-moss-900 pt-32 pb-14 sm:pt-36">
        <div className="container-page">
          <p className="mb-4 inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.24em] text-blush-300 uppercase">
            <span className="h-px w-6 bg-blush-300/60" aria-hidden />
            {about.eyebrow}
          </p>

          <h1 className="font-display text-3xl leading-[1.15] font-medium tracking-tight text-balance text-canvas sm:text-4xl lg:text-5xl">
            {about.title}
          </h1>
        </div>
      </header>

      <section className="bg-canvas py-14 sm:py-16 lg:py-20">
        <div className="container-page">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas-deep">
              <Image
                src={about.imageUrl}
                alt={about.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Body copy */}
            <div className="space-y-5 text-base leading-relaxed text-ink-soft lg:py-4">
              {about.body.split("\n").filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
