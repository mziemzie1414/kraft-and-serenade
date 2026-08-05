-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLines" TEXT[],
    "facebookUrl" TEXT NOT NULL,
    "manualPaymentQrUrl" TEXT,
    "manualPaymentInstructions" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_hour" (
    "id" TEXT NOT NULL,
    "days" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "business_hour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_hour_storeId_position_idx" ON "business_hour"("storeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_session_tokenHash_key" ON "admin_session"("tokenHash");

-- CreateIndex
CREATE INDEX "admin_session_expiresAt_idx" ON "admin_session"("expiresAt");

-- AddForeignKey
ALTER TABLE "business_hour" ADD CONSTRAINT "business_hour_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
