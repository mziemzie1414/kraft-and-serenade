-- CreateTable
CREATE TABLE "reviews_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "purchased" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_image" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "linkUrl" TEXT,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "gallery_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_banner_section" (
    "id" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "badge" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaHref" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "codeLabel" TEXT NOT NULL,
    "code" TEXT,
    "codeNote" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_banner_section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_sectionId_position_idx" ON "review"("sectionId", "position");

-- CreateIndex
CREATE INDEX "gallery_image_sectionId_position_idx" ON "gallery_image"("sectionId", "position");

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "reviews_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_image" ADD CONSTRAINT "gallery_image_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "gallery_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
