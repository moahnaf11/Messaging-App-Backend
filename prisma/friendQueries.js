import { prisma } from "./prismaClient.js";

const getFriends = async (id) => {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [{ requesterId: id }, { requesteeId: id }],
    },
    include: {
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      Notification: {
        where: {
          receiverId: id,
        },
      },
    },
  });
  console.log("all friends", friends);
  return friends;
};

const checkFriendRecord = async (id, userId) => {
  const friend = await prisma.friend.findFirst({
    where: {
      OR: [
        { requesteeId: id, requesterId: userId },
        { requesterId: id, requesteeId: userId },
      ],
    },
  });
  console.log("friend record exists", friend);
  return friend;
};

const sendPostFriendRequest = async (id, requesteeId) => {
  const friend = await prisma.friend.create({
    data: {
      requesterId: id,
      requesteeId: requesteeId,
    },
    include: {
      Notification: {
        where: {
          receiverId: id,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });
  console.log("sent friend request", friend);
  return friend;
};

const getRequests = async (id) => {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [
        { requesterId: id, status: "pending" }, // Outgoing requests
        { requesteeId: id, status: "pending" }, // Incoming requests
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        }, // Customize returned fields
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        }, // Customize returned fields
      },
    },
  });

  console.log("all pending friend requests", friends);
  return friends;
};

const updateRequestStatus = async (id, handleRequest, userId) => {
  if (handleRequest === "rejected") {
    const friend = await prisma.friend.delete({
      where: {
        id: id,
      },
    });
    console.log("rejected friend request and deleted it!", friend);
    return friend;
  }
  const friend = await prisma.friend.update({
    where: {
      id: id,
    },
    data: {
      status: handleRequest,
    },
    include: {
      Notification: {
        where: {
          receiverId: userId,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });
  console.log("updated friend status", friend);
  return friend;
};

const cancelRequest = async (id, userId) => {
  const friend = await prisma.friend.delete({
    where: {
      id: id,
    },
    include: {
      Notification: {
        where: {
          receiverId: userId,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });
  console.log("canceled friend request", friend);
  return friend;
};

const handleBlockUser = async (id, userId, handleBlock) => {
  const friend = await prisma.friend.update({
    where: {
      id: id,
    },
    data: {
      status: handleBlock,
      blocker_id: userId,
    },
    include: {
      Notification: {
        where: {
          receiverId: userId,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });
  console.log("updated block status of user", friend);
  return friend;
};

const archiveUnarchiveChat = async (id, userId, action) => {
  const friend = await prisma.friend.findUnique({
    where: {
      id: id,
    },
  });
  const updateData = {};
  if (userId === friend.requesterId) {
    updateData.requester_display = action;
  } else if (userId === friend.requesteeId) {
    updateData.requestee_display = action;
  } else {
    throw new Error("User not authorized to update this chat");
  }

  // Perform the update
  const updatedFriend = await prisma.friend.update({
    where: { id },
    data: updateData,
    include: {
      Notification: {
        where: {
          receiverId: userId,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });

  console.log("Updated display status of chat", updatedFriend);
  return updatedFriend;
};

const friendNotification = async (senderId, friendId, receiverId) => {
  const friend = await prisma.friend.update({
    where: { id: friendId },
    data: {
      // Any updates to the Friend model (if needed)

      // Nested create for the notification
      Notification: {
        create: {
          senderId,
          receiverId,
        },
      },
    },
    include: {
      Notification: {
        where: {
          receiverId,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });

  console.log("notification created", friend);
  return friend;
};

const deleteNotifications = async (id, userId) => {
  const updatedFriend = await prisma.friend.update({
    where: { id }, // Find the friend record
    data: {
      Notification: {
        deleteMany: {
          receiverId: userId, // Delete notifications where the user is the receiver
        },
      },
    },
    include: {
      Notification: {
        where: {
          receiverId: userId,
        },
      },
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
          showOnlineStatus: true,
          status: true,
        },
      },
    },
  });
  console.log("notifications deleted", updatedFriend);
  return updatedFriend;
};

export {
  sendPostFriendRequest,
  getRequests,
  updateRequestStatus,
  cancelRequest,
  handleBlockUser,
  getFriends,
  checkFriendRecord,
  archiveUnarchiveChat,
  friendNotification,
  deleteNotifications,
};
