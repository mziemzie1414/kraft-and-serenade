-- CreateTable
CREATE TABLE "hero_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "headingLead" TEXT NOT NULL,
    "headingAccent" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primaryCtaLabel" TEXT NOT NULL,
    "primaryCtaHref" TEXT NOT NULL,
    "secondaryCtaLabel" TEXT NOT NULL,
    "secondaryCtaHref" TEXT NOT NULL,
    "backgroundImageUrl" TEXT NOT NULL,
    "backgroundImageAlt" TEXT NOT NULL,
    "ratingValue" DOUBLE PRECISION NOT NULL,
    "ratingCaption" TEXT NOT NULL,
    "reviewAvatarUrls" TEXT[],
    "accentImageUrl" TEXT NOT NULL,
    "accentTitle" TEXT NOT NULL,
    "accentCaption" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_trust_point" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "desktopOnly" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "heroSectionId" TEXT NOT NULL,

    CONSTRAINT "hero_trust_point_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_trust_point_heroSectionId_position_idx" ON "hero_trust_point"("heroSectionId", "position");

-- AddForeignKey
ALTER TABLE "hero_trust_point" ADD CONSTRAINT "hero_trust_point_heroSectionId_fkey" FOREIGN KEY ("heroSectionId") REFERENCES "hero_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
