/*
  Warnings:

  - You are about to drop the column `groupId` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_groupId_fkey";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "groupId";

-- CreateTable
CREATE TABLE "GroupChatNotification" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupChatNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chat_notification_recipients" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "groupMemberId" TEXT NOT NULL,

    CONSTRAINT "group_chat_notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_chat_notification_recipients_notificationId_groupMemb_key" ON "group_chat_notification_recipients"("notificationId", "groupMemberId");

-- AddForeignKey
ALTER TABLE "GroupChatNotification" ADD CONSTRAINT "GroupChatNotification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_notification_recipients" ADD CONSTRAINT "group_chat_notification_recipients_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "GroupChatNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_notification_recipients" ADD CONSTRAINT "group_chat_notification_recipients_groupMemberId_fkey" FOREIGN KEY ("groupMemberId") REFERENCES "group_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
