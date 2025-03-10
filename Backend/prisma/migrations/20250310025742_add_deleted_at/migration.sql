-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FieldMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facultyId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "columnIndex" INTEGER,
    "displayIn" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FieldMapping_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FieldMapping" ("columnIndex", "createdAt", "displayIn", "facultyId", "fieldKey", "id", "label", "updatedAt") SELECT "columnIndex", "createdAt", "displayIn", "facultyId", "fieldKey", "id", "label", "updatedAt" FROM "FieldMapping";
DROP TABLE "FieldMapping";
ALTER TABLE "new_FieldMapping" RENAME TO "FieldMapping";
CREATE UNIQUE INDEX "FieldMapping_facultyId_fieldKey_key" ON "FieldMapping"("facultyId", "fieldKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
