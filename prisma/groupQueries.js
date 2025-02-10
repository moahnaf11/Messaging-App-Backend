import { prisma } from "./prismaClient.js";

const createGroupChat = async (name, creatorId, members) => {
  const group = await prisma.groupChat.create({
    data: {
      name,
      creatorId,
      members: {
        create: members.map((userId) => ({
          userId,
          role: userId === creatorId ? "admin" : "member",
        })),
      },
    },
    include: {
      members: true, // Optional: To return created members in the response
    },
  });

  return group;
};

const allGroups = async () => {
  const groups = await prisma.groupChat.findMany();
  return groups;
};

const singleGroup = async (id) => {
  const group = await prisma.groupChat.findUnique({
    where: {
      id,
    },
    include: {
      members: { include: { user: true } }, // Include member details
      messages: { orderBy: { timestamp: "asc" } }, // Get messages in order
    },
  });

  return group;
};

const addMemberToGroup = async (userId, groupId, role) => {
  const groupMember = await prisma.groupMember.create({
    data: {
      userId,
      groupId,
      role,
    },
  });

  return groupMember;
};

const removeUserFromGroup = async (id, userId) => {
  const groupMember = await prisma.groupMember.deleteMany({
    where: {
      groupId: id,
      userId,
    },
  });

  return groupMember;
};

const deletingGroup = async (id) => {
  const group = await prisma.groupChat.delete({
    where: {
      id,
    },
  });

  return group;
};

export {
  createGroupChat,
  allGroups,
  singleGroup,
  addMemberToGroup,
  removeUserFromGroup,
  deletingGroup,
};
