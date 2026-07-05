-- Add authorId as nullable first: the table already has rows, so a NOT NULL
-- column without a default cannot be added in one step.
ALTER TABLE "Sticker" ADD COLUMN "authorId" TEXT;

-- Backfill existing stickers with the board owner (Sticker -> Column -> Board.ownerId):
-- pre-authorship stickers could only have been created by someone with board access,
-- and the owner is the safest attribution we have.
UPDATE "Sticker" s
SET "authorId" = b."ownerId"
FROM "Column" c
JOIN "Board" b ON b."id" = c."boardId"
WHERE c."id" = s."columnId";

ALTER TABLE "Sticker" ALTER COLUMN "authorId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Sticker_authorId_idx" ON "Sticker"("authorId");

-- AddForeignKey
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
