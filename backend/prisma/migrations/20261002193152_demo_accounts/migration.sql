-- CreateEnum
CREATE TYPE "UserKind" AS ENUM ('REGULAR', 'GUEST', 'DEMO_TEAMMATE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "kind" "UserKind" NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE INDEX "User_kind_expiresAt_idx" ON "User"("kind", "expiresAt");

-- Seed the demo teammates. '!' is not a bcrypt hash, so no password matches it;
-- login also rejects every non-REGULAR account before comparing.
INSERT INTO "User" ("id", "email", "passwordHash", "name", "kind", "updatedAt") VALUES
  ('00000000-0000-4000-8000-000000000001', 'alex.demo@example.com', '!', 'Alex', 'DEMO_TEAMMATE', CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', 'sam.demo@example.com', '!', 'Sam', 'DEMO_TEAMMATE', CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000003', 'jordan.demo@example.com', '!', 'Jordan', 'DEMO_TEAMMATE', CURRENT_TIMESTAMP);
