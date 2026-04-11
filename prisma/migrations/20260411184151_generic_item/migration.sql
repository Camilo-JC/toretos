-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DebtItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "debtId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebtItem_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DebtItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DebtItem" ("createdAt", "debtId", "id", "price", "productId", "quantity") SELECT "createdAt", "debtId", "id", "price", "productId", "quantity" FROM "DebtItem";
DROP TABLE "DebtItem";
ALTER TABLE "new_DebtItem" RENAME TO "DebtItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
