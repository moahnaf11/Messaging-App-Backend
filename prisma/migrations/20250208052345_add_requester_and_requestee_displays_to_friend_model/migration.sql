/*
  Warnings:

  - You are about to drop the column `display` on the `friends` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "friends" DROP COLUMN "display",
ADD COLUMN     "requestee_display" TEXT NOT NULL DEFAULT 'unarchived',
ADD COLUMN     "requester_display" TEXT NOT NULL DEFAULT 'unarchived';
