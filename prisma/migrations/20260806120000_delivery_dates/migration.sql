-- AlterTable
ALTER TABLE "order" ADD COLUMN     "deliveryDate" DATE,
ADD COLUMN     "rushFee" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "delivery_settings" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rushFee" INTEGER NOT NULL,
    "rushWithinDays" INTEGER NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "maxAdvanceDays" INTEGER NOT NULL,
    "closedWeekdays" INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_date_exception" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "settingsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_date_exception_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_date_exception_settingsId_date_idx" ON "delivery_date_exception"("settingsId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_date_exception_date_key" ON "delivery_date_exception"("date");

-- CreateIndex
CREATE INDEX "order_deliveryDate_idx" ON "order"("deliveryDate");

-- AddForeignKey
ALTER TABLE "delivery_date_exception" ADD CONSTRAINT "delivery_date_exception_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "delivery_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
