/*
  Warnings:

  - You are about to drop the column `mediaId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `messages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `medias` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `messageId` to the `medias` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_mediaId_fkey";

-- AlterTable
ALTER TABLE "medias" ADD COLUMN     "messageId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "mediaId",
DROP COLUMN "type";

-- CreateIndex
CREATE UNIQUE INDEX "medias_messageId_key" ON "medias"("messageId");

-- AddForeignKey
ALTER TABLE "medias" ADD CONSTRAINT "medias_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
