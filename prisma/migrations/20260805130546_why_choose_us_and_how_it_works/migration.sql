-- CreateTable
CREATE TABLE "why_choose_us_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "primaryImageUrl" TEXT NOT NULL,
    "primaryImageAlt" TEXT NOT NULL,
    "secondaryImageUrl" TEXT NOT NULL,
    "badgeValue" TEXT NOT NULL,
    "badgeLabel" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "why_choose_us_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "why_choose_us_point" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "why_choose_us_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "why_choose_us_stat" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "why_choose_us_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "how_it_works_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "calloutTitle" TEXT NOT NULL,
    "calloutBody" TEXT NOT NULL,
    "calloutCtaLabel" TEXT NOT NULL,
    "calloutCtaHref" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "how_it_works_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "how_it_works_step" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "how_it_works_step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "why_choose_us_point_sectionId_position_idx" ON "why_choose_us_point"("sectionId", "position");

-- CreateIndex
CREATE INDEX "why_choose_us_stat_sectionId_position_idx" ON "why_choose_us_stat"("sectionId", "position");

-- CreateIndex
CREATE INDEX "how_it_works_step_sectionId_position_idx" ON "how_it_works_step"("sectionId", "position");

-- AddForeignKey
ALTER TABLE "why_choose_us_point" ADD CONSTRAINT "why_choose_us_point_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "why_choose_us_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "why_choose_us_stat" ADD CONSTRAINT "why_choose_us_stat_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "why_choose_us_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "how_it_works_step" ADD CONSTRAINT "how_it_works_step_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "how_it_works_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
