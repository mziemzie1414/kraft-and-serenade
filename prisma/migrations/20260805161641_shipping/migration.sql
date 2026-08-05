-- CreateEnum
CREATE TYPE "ShippingScope" AS ENUM ('REGION', 'CITY');

-- CreateTable
CREATE TABLE "shipping_settings" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "flatRate" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rate" (
    "id" TEXT NOT NULL,
    "scope" "ShippingScope" NOT NULL,
    "psgcCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,
    "settingsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipping_rate_settingsId_idx" ON "shipping_rate"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_rate_scope_psgcCode_key" ON "shipping_rate"("scope", "psgcCode");

-- AddForeignKey
ALTER TABLE "shipping_rate" ADD CONSTRAINT "shipping_rate_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "shipping_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
