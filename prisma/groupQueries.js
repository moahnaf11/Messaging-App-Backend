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
  console.log("created group", group);
  return group;
};

const allGroups = async (id) => {
  const groups = await prisma.groupChat.findMany({
    where: {
      members: {
        some: {
          userId: id, // Ensure userId is part of the group
        },
      },
    },
    include: { members: true },
  });
  console.log("all groups part of", groups);
  return groups;
};

const singleGroup = async (id) => {
  const group = await prisma.groupChat.findUnique({
    where: {
      id,
    },
    include: {
      members: { include: { user: true } }, // Include member details
      creator: true,
      messages: {
        orderBy: { timestamp: "asc" },
        include: { media: true, sender: true },
      }, // Get messages in order
    },
  });
  console.log("single group with messages ordered", group);
  return group;
};

const addMemberToGroup = async (userId, groupId, role) => {
  const groupMember = await prisma.groupMember.create({
    data: {
      userId,
      groupId,
      role,
    },
    include: {
      user: true,
    },
  });
  console.log("added member to group", groupMember);
  return groupMember;
};

const removeUserFromGroup = async (id, userId) => {
  const groupMember = await prisma.groupMember.deleteMany({
    where: {
      groupId: id,
      userId,
    },
  });
  console.log("removed group member", groupMember);
  return groupMember;
};

const deletingGroup = async (id) => {
  const group = await prisma.groupChat.delete({
    where: {
      id,
    },
  });
  console.log("deleted group", group);
  return group;
};

const findMemberInGroup = async (id, userId) => {
  const user = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: userId,
        groupId: id,
      },
    },
  });
  return user;
};

const updateMemberRole = async (id, memberId, role) => {
  const groupMember = await prisma.groupMember.update({
    where: {
      groupId: id,
      id: memberId,
    },
    data: {
      role,
    },
  });
  console.log("updated member role", groupMember);
  return groupMember;
};

const getGroupPicture = async (id) => {
  const picture = await prisma.groupChat.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      picture: true,
      public_id: true,
    },
  });
  console.log("group picture", picture);
  return picture;
};

const updateGroupPic = async (id, picurl, pickey) => {
  const group = await prisma.groupChat.update({
    where: { id },
    data: {
      picture: picurl,
      public_id: pickey,
    },
    include: {
      members: { include: { user: true } },
      creator: true,
    },
  });
  console.log("updated group picture", group);
  return group;
};

const updateGroupName = async (id, name) => {
  const group = await prisma.groupChat.update({
    where: {
      id,
    },
    data: {
      name,
    },
    include: { members: { include: { user: true } }, creator: true },
  });
  console.log("updated group name", group);
  return group;
};

const editAdmin = async (id, action) => {
  const group = await prisma.groupChat.update({
    where: {
      id,
    },
    data: {
      admin_only: action,
    },
    include: {
      members: { include: { user: true } },
      creator: true,
    },
  });
  console.log("updated for admin only", group);
  return group;
};

const archiveUnarchiveGroup = async (id, userid, action) => {
  const group = await prisma.groupChat.update({
    where: { id }, // Find the group by ID
    data: {
      members: {
        updateMany: {
          where: { userId: userid }, // Update only the specific user
          data: { archived: action }, // Set the new archive status
        },
      },
    },
    include: { members: true },
  });
  console.log("updated archive status for user", group);
  return group;
};
export {
  createGroupChat,
  allGroups,
  singleGroup,
  addMemberToGroup,
  removeUserFromGroup,
  deletingGroup,
  updateMemberRole,
  findMemberInGroup,
  getGroupPicture,
  updateGroupPic,
  updateGroupName,
  editAdmin,
  archiveUnarchiveGroup,
};
