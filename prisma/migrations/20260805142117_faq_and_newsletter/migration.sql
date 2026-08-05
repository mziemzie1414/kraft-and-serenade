-- CreateTable
CREATE TABLE "faq_section" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lede" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "pageLede" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "showOnHome" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_sectionId_position_idx" ON "faq"("sectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");

-- AddForeignKey
ALTER TABLE "faq" ADD CONSTRAINT "faq_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "faq_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
