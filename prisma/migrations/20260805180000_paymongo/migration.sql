-- AlterTable
ALTER TABLE "order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymongoPaymentId" TEXT,
ADD COLUMN     "paymongoPaymentIntentId" TEXT,
ADD COLUMN     "qrCodeImage" TEXT,
ADD COLUMN     "qrExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_paymongoPaymentIntentId_key" ON "order"("paymongoPaymentIntentId");
