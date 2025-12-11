/*
  Warnings:

  - You are about to drop the column `user_id` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `mp_user_id` on the `mp_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `user_favourite_vendors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `profile_id` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mp_profile_id` to the `mp_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_favourite_vendors" DROP CONSTRAINT "user_favourite_vendors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_favourite_vendors" DROP CONSTRAINT "user_favourite_vendors_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_owner_id_fkey";

-- DropIndex
DROP INDEX "mp_accounts_mp_user_id_idx";

-- DropIndex
DROP INDEX "orders_user_id_idx";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "user_id",
ADD COLUMN     "profile_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "mp_accounts" DROP COLUMN "mp_user_id",
ADD COLUMN     "mp_profile_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "user_id",
ADD COLUMN     "profile_id" UUID NOT NULL;

-- DropTable
DROP TABLE "user_favourite_vendors";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "full_name" TEXT,
    "dni" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_favourite_vendors" (
    "id" SERIAL NOT NULL,
    "profile_id" UUID NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_favourite_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profile_favourite_vendors_profile_id_idx" ON "profile_favourite_vendors"("profile_id");

-- CreateIndex
CREATE INDEX "profile_favourite_vendors_vendor_id_idx" ON "profile_favourite_vendors"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_favourite_vendors_profile_id_vendor_id_key" ON "profile_favourite_vendors"("profile_id", "vendor_id");

-- CreateIndex
CREATE INDEX "mp_accounts_mp_profile_id_idx" ON "mp_accounts"("mp_profile_id");

-- CreateIndex
CREATE INDEX "orders_profile_id_idx" ON "orders"("profile_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_favourite_vendors" ADD CONSTRAINT "profile_favourite_vendors_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_favourite_vendors" ADD CONSTRAINT "profile_favourite_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
