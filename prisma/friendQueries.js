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
          status: true,
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
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
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
          status: true,
        }, // Customize returned fields
      },
    },
  });

  console.log("all pending friend requests", friends);
  return friends;
};

const updateRequestStatus = async (id, handleRequest) => {
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
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
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
          status: true,
        },
      },
    },
  });
  console.log("updated friend status", friend);
  return friend;
};

const cancelRequest = async (id) => {
  const friend = await prisma.friend.delete({
    where: {
      id: id,
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
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
          profilePicture: true,
          online: true,
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
          status: true,
        },
      },
    },
  });
  console.log("updated block status of user", friend);
  return friend;
};

export {
  sendPostFriendRequest,
  getRequests,
  updateRequestStatus,
  cancelRequest,
  handleBlockUser,
  getFriends,
  checkFriendRecord,
};
