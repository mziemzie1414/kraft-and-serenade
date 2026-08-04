import Image from "next/image";
import Link from "next/link";
import { GALLERY_IMAGES } from "@/lib/data";
import { InstagramIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function InstagramGallery() {
  return (
    <section
      id="gallery"
      className="scroll-mt-24 border-y border-canvas-deep/60 bg-canvas-alt py-20 sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="From the studio"
          title="@kraftandserenade"
          lede="Bench shots, market hauls and finished bouquets. Tag us and we will repost."
          action={
            <Link
              href="#gallery"
              className="inline-flex items-center gap-2.5 rounded-full border border-moss-700/25 px-5 py-3 text-sm font-semibold text-moss-700 transition-colors duration-300 hover:bg-moss-700 hover:text-canvas"
            >
              <InstagramIcon className="h-4 w-4" />
              Follow along
            </Link>
          }
        />

        <ul className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {GALLERY_IMAGES.map((image, index) => (
            <li
              key={image.src}
              /* Two tiles span a larger area to break the uniform grid. */
              className={index === 0 || index === 5 ? "sm:col-span-2 sm:row-span-2" : undefined}
            >
              <Link
                href="#gallery"
                aria-label={`Open studio photo: ${image.caption}`}
                className="group relative flex aspect-square h-full w-full overflow-hidden rounded-xl bg-canvas-deep"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={
                    index === 0 || index === 5
                      ? "(min-width: 640px) 45vw, 45vw"
                      : "(min-width: 640px) 23vw, 45vw"
                  }
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />

                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-moss-900/85 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="flex items-center gap-2 text-xs font-medium text-canvas">
                    <InstagramIcon className="h-3.5 w-3.5" />
                    {image.caption}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
