/*
  Warnings:

  - You are about to drop the column `boardId` on the `Sticker` table. All the data in the column will be lost.
  - You are about to drop the column `positionX` on the `Sticker` table. All the data in the column will be lost.
  - You are about to drop the column `positionY` on the `Sticker` table. All the data in the column will be lost.
  - Added the required column `columnId` to the `Sticker` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Sticker` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sticker" DROP CONSTRAINT "Sticker_boardId_fkey";

-- DropIndex
DROP INDEX "Sticker_boardId_idx";

-- AlterTable
ALTER TABLE "Sticker" DROP COLUMN "boardId",
DROP COLUMN "positionX",
DROP COLUMN "positionY",
ADD COLUMN     "columnId" TEXT NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Column" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boardId" TEXT NOT NULL,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Column_boardId_idx" ON "Column"("boardId");

-- CreateIndex
CREATE INDEX "Sticker_columnId_idx" ON "Sticker"("columnId");

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;
