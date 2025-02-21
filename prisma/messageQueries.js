import { prisma } from "./prismaClient.js";

const getMessagesByFriendId = async (friendId) => {
  // Find the friend relationship
  const friend = await prisma.friend.findUnique({
    where: { id: friendId },
    include: {
      requester: true,
      requestee: true,
    },
  });

  if (!friend) {
    return { messages: [], friend };
  }

  const { requesterId, requesteeId } = friend;

  // Fetch messages between the requester and requestee
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: requesterId, receiverId: requesteeId },
        { senderId: requesteeId, receiverId: requesterId },
      ],
    },
    orderBy: { timestamp: "asc" }, // Order by timestamp
    include: {
      media: true, // Include media if needed
      sender: true,
    },
  });

  return { messages, friend };
};

const uploadMessageWithMedia = async (
  id,
  receiverId,
  groupChatId,
  content,
  uploadedMedia,
  friendId
) => {
  const message = await prisma.message.create({
    data: {
      content: content,
      receiverId: receiverId,
      groupChatId,
      senderId: id,
      friendId,
      media: {
        create: uploadedMedia.map((media) => ({
          public_id: media.public_id,
          type: media.resource_type,
          url: media.secure_url,
          uploadedById: id,
        })),
      },
    },
    include: {
      media: true,
      sender: true,
    },
  });
  console.log("message created with media", message);

  return message;
};

const uploadMessage = async (
  id,
  receiverId,
  groupChatId,
  content,
  friendId
) => {
  const message = await prisma.message.create({
    data: {
      content: content,
      senderId: id,
      groupChatId,
      receiverId: receiverId,
      friendId,
    },
    include: {
      media: true,
      sender: true,
    },
  });
  console.log("message with no media", message);
  return message;
};

const getMessage = async (id) => {
  const message = await prisma.message.findUnique({
    where: {
      id: id,
    },
    include: {
      media: true,
      sender: true,
    },
  });
  console.log("found message", message);
  return message;
};

const delMessage = async (id) => {
  const message = await prisma.message.delete({
    where: {
      id: id,
    },
    include: { sender: true },
  });
  console.log("deleted message", message);
  return message;
};

const editMessage = async (id, content) => {
  const message = await prisma.message.update({
    where: {
      id: id,
    },
    data: {
      content: content,
    },
    include: {
      media: true,
      sender: true,
    },
  });
  console.log("updated message", message);
  return message;
};

export {
  uploadMessageWithMedia,
  uploadMessage,
  delMessage,
  getMessage,
  editMessage,
  getMessagesByFriendId,
};
