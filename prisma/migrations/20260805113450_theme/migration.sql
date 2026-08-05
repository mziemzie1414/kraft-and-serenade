-- CreateTable
CREATE TABLE "theme" (
    "id" TEXT NOT NULL,
    "canvas" TEXT NOT NULL,
    "canvasAlt" TEXT NOT NULL,
    "canvasDeep" TEXT NOT NULL,
    "ink" TEXT NOT NULL,
    "inkSoft" TEXT NOT NULL,
    "inkFaint" TEXT NOT NULL,
    "moss50" TEXT NOT NULL,
    "moss100" TEXT NOT NULL,
    "moss400" TEXT NOT NULL,
    "moss600" TEXT NOT NULL,
    "moss700" TEXT NOT NULL,
    "moss900" TEXT NOT NULL,
    "blush50" TEXT NOT NULL,
    "blush100" TEXT NOT NULL,
    "blush300" TEXT NOT NULL,
    "blush500" TEXT NOT NULL,
    "blush600" TEXT NOT NULL,
    "gold" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_pkey" PRIMARY KEY ("id")
);
