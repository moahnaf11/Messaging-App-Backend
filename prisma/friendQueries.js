import { prisma } from "./prismaClient.js";

const getFriends = async (id) => {
  const friends = await prisma.friend.findMany({
    where: {
      OR: [
        { requesteeId: id, status: "accepted" },
        { requesterId: id, status: "accepted" },
      ],
    },
    include: {
      requestee: {
        select: { id: true, firstname: true, lastname: true, username: true },
      },
      requester: {
        select: { id: true, firstname: true, lastname: true, username: true },
      },
    },
  });
  console.log("all friends", friends);
  return friends;
};

const sendPostFriendRequest = async (id, requesteeId) => {
  const friend = await prisma.friend.create({
    data: {
      requesterId: id,
      requesteeId: requesteeId,
    },
    include: {
      requestee: {
        select: { id: true, firstname: true, lastname: true, username: true },
      },
      requester: {
        select: { id: true, firstname: true, lastname: true, username: true },
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
        select: { id: true, firstname: true, lastname: true, username: true }, // Customize returned fields
      },
      requestee: {
        select: { id: true, firstname: true, lastname: true, username: true }, // Customize returned fields
      },
    },
  });

  console.log("all pending friend requests", friends);
  return friends;
};

const updateRequestStatus = async (id, handleRequest) => {
  const friend = await prisma.friend.update({
    where: {
      id: id,
    },
    data: {
      status: handleRequest,
    },
    include: {
      requestee: {
        select: { id: true, firstname: true, lastname: true, username: true },
      },
      requester: {
        select: { id: true, firstname: true, lastname: true, username: true },
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
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
        },
      },
    },
  });
  console.log("canceled friend request", friend);
  return friend;
};

const handleBlockUser = async (id, handleBlock) => {
  const friend = await prisma.friend.update({
    where: {
      id: id,
    },
    data: {
      status: handleBlock,
    },
    include: {
      requestee: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
        },
      },
      requester: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          username: true,
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
  getFriends
};
