-- AlterTable
ALTER TABLE "product" ADD COLUMN     "bestSellerRank" INTEGER;

-- CreateIndex
CREATE INDEX "product_bestSellerRank_idx" ON "product"("bestSellerRank");
