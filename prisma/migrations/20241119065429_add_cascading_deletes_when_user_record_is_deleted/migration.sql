-- DropForeignKey
ALTER TABLE "friends" DROP CONSTRAINT "friends_requesteeId_fkey";

-- DropForeignKey
ALTER TABLE "friends" DROP CONSTRAINT "friends_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "medias" DROP CONSTRAINT "medias_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_requesteeId_fkey" FOREIGN KEY ("requesteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "medias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medias" ADD CONSTRAINT "medias_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
