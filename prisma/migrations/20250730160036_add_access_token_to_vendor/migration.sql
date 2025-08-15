-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT 'Av. Siempre Viva 742',
    "openingHours" DATETIME NOT NULL DEFAULT '1970-01-01 10:00:00 +00:00',
    "closingHours" DATETIME NOT NULL DEFAULT '1970-01-01 18:00:00 +00:00',
    "mercadoPagoAccessToken" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Vendor" ("address", "closingHours", "id", "name", "openingHours") SELECT "address", "closingHours", "id", "name", "openingHours" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
