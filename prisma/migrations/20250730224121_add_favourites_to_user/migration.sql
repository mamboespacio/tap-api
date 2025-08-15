-- CreateTable
CREATE TABLE "_FavouriteVendors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FavouriteVendors_A_fkey" FOREIGN KEY ("A") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FavouriteVendors_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_FavouriteVendors_AB_unique" ON "_FavouriteVendors"("A", "B");

-- CreateIndex
CREATE INDEX "_FavouriteVendors_B_index" ON "_FavouriteVendors"("B");
