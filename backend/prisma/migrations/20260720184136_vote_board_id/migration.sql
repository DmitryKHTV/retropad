-- Denormalize boardId onto Vote. Safe because a sticker can never change board:
-- StickersService rejects cross-board moves, so Vote.boardId is immutable once set.
--
-- Adding a NOT NULL column to a populated table takes three steps: add it
-- nullable, backfill, then tighten the constraint.

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN "boardId" TEXT;

-- Backfill existing votes through the Sticker -> Column ownership chain
UPDATE "Vote" v
SET "boardId" = c."boardId"
FROM "Sticker" s
JOIN "Column" c ON c."id" = s."columnId"
WHERE s."id" = v."stickerId";

ALTER TABLE "Vote" ALTER COLUMN "boardId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Vote_boardId_userId_idx" ON "Vote"("boardId", "userId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
