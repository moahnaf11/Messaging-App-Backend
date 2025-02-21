-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "friendId" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "friendId" TEXT,
    "groupId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "friends"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "friends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
