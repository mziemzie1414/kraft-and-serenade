import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getGalleryContent } from "@/lib/gallery";

export async function InstagramGallery() {
  const content = await getGalleryContent();

  if (content.images.length === 0) return null;

  return (
    <section
      id="gallery"
      className="scroll-mt-24 border-y border-canvas-deep/60 bg-canvas-alt py-20 sm:py-24 lg:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          lede={content.lede}
          action={
            <Link
              href={content.ctaHref}
              className="inline-flex items-center gap-2.5 rounded-full border border-moss-700/25 px-5 py-3 text-sm font-semibold text-moss-700 transition-colors duration-300 hover:bg-moss-700 hover:text-canvas"
            >
              <InstagramIcon className="h-4 w-4" />
              {content.ctaLabel}
            </Link>
          }
        />

        <ul className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {content.images.map((image, index) => {
            /* Two tiles span a larger area to break the uniform grid. */
            const wide = index === 0 || index === 5;

            const tile = (
              <>
                <Image
                  src={image.imageUrl}
                  alt={image.alt}
                  fill
                  sizes={
                    wide
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
              </>
            );

            const shell = "group relative flex aspect-square h-full w-full overflow-hidden rounded-xl bg-canvas-deep";

            return (
              <li
                key={`${image.imageUrl}-${index}`}
                className={wide ? "sm:col-span-2 sm:row-span-2" : undefined}
              >
                {/* Only a tile with a destination becomes a link, so the grid
                    does not add keyboard stops that lead nowhere. */}
                {image.linkUrl ? (
                  <Link
                    href={image.linkUrl}
                    aria-label={`Open studio photo: ${image.caption}`}
                    className={shell}
                  >
                    {tile}
                  </Link>
                ) : (
                  <div className={shell}>{tile}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
