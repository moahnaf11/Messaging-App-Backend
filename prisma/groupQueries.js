import { prisma } from "./prismaClient.js";

const createGroupChat = async (name, creatorId, members, myId) => {
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
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            where: {
              groupMember: {
                userId: myId, // Only include notifications where the user is a recipient
              },
            },
          },
        },
      },
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
    include: {
      members: true,
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            // include: { groupMember: true }, // Explicitly include groupMember
            where: { groupMember: { userId: id } }, // Filter only notifications for this user
          },
        },
      },
    },
  });
  console.log("all groups part of", groups);
  return groups;
};

const singleGroup = async (id, userId) => {
  const group = await prisma.groupChat.findUnique({
    where: {
      id,
    },
    include: {
      members: { include: { user: true } }, 
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            where: {
              groupMember: {
                userId, // Only include notifications where the user is a recipient
              },
            },
          },
        },
      },
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

const updateGroupPic = async (id, picurl, pickey, userId) => {
  const group = await prisma.groupChat.update({
    where: { id },
    data: {
      picture: picurl,
      public_id: pickey,
    },
    include: {
      members: { include: { user: true } },
      creator: true,
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            where: {
              groupMember: {
                userId, // Only include notifications where the user is a recipient
              },
            },
          },
        },
      },
    },
  });
  console.log("updated group picture", group);
  return group;
};

const updateGroupName = async (id, name, userId) => {
  const group = await prisma.groupChat.update({
    where: {
      id,
    },
    data: {
      name,
    },
    include: {
      members: { include: { user: true } },
      creator: true,
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            where: {
              groupMember: {
                userId, // Only include notifications where the user is a recipient
              },
            },
          },
        },
      },
    },
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
    include: {
      members: true,
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            where: {
              groupMember: {
                userId: userid, // Only include notifications where the user is a recipient
              },
            },
          },
        },
      },
    },
  });
  console.log("updated archive status for user", group);
  return group;
};

const getGroupMembers = async (groupId, senderId) => {
  const groupMembers = await prisma.groupMember.findMany({
    where: {
      groupId: groupId,
      userId: { not: senderId }, // Exclude the sender
    },
    select: { id: true }, // We only need member IDs
  });
  console.log("all members expect sender", groupMembers);
  return groupMembers;
};

const groupNotification = async (groupId, senderId) => {
  const newNotification = await prisma.groupChatNotification.create({
    data: {
      senderId: senderId,
      groupId: groupId,
    },
  });
  console.log("created group notification", newNotification);
  return newNotification;
};

const groupMemberNotis = async (recipientData) => {
  const groupMemberNotifs =
    await prisma.groupChatNotificationRecipient.createMany({
      data: recipientData,
    });
  console.log(
    "created notification for each member of the group",
    groupMemberNotifs
  );
};

const getGroupWithNotifications = async (groupId, userId) => {
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId, // Find the group by id
    },
    include: {
      members: true,
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            include: { groupMember: true }, // Include groupMember
            where: { groupMember: { userId } }, // Filter notifications for the specific user
          },
        },
      },
    },
  });

  console.log("Single group with notifications:", group);
  return group;
};

const deleteGroupNotification = async (userId, notificationId) => {
  // Delete the recipient entry directly using userId
  const noti = await prisma.groupChatNotificationRecipient.deleteMany({
    where: {
      notificationId,
      groupMember: {
        userId: userId, // Filter by userId inside groupMember
      },
    },
  });

  // 2️⃣ Check if any recipients are left for this notification
  const remainingRecipients =
    await prisma.groupChatNotificationRecipient.findFirst({
      where: { notificationId },
    });

  // 3️⃣ If no recipients are left, delete the group notification
  if (!remainingRecipients) {
    await prisma.groupChatNotification.delete({
      where: { id: notificationId },
    });

    console.log(
      "Group chat notification deleted since no recipients were left."
    );
  } else {
    console.log(
      "Notification deleted for user, but other recipients still exist."
    );
  }

  console.log("Notification deleted successfully", noti);
};

const deleteAllGroupNotifs = async (userId, groupId) => {
  const result = await prisma.$transaction(async (prisma) => {
    const allNotisForUser =
      await prisma.groupChatNotificationRecipient.deleteMany({
        where: {
          groupMember: { userId },
          notification: { groupId },
        },
      });
    console.log(
      "deleted all group notis for user in useeffect",
      allNotisForUser
    );
    // 2️⃣ Find all remaining notifications for this group
    const remainingNotifications = await prisma.groupChatNotification.findMany({
      where: { groupId },
      include: { GroupChatNotificationRecipient: true }, // Include recipients
    });

    // 3️⃣ Delete group notifications that have no recipients left
    const notificationsToDelete = remainingNotifications
      .filter((noti) => noti.GroupChatNotificationRecipient.length === 0)
      .map((noti) => noti.id); // Get IDs of empty notifications

    if (notificationsToDelete.length > 0) {
      await prisma.groupChatNotification.deleteMany({
        where: { id: { in: notificationsToDelete } },
      });
      console.log(
        "Deleted group notifications with no recipients:",
        notificationsToDelete
      );
    }
  });
  const group = await prisma.groupChat.findUnique({
    where: {
      id: groupId,
    },
    include: {
      members: true, // Include all members of the group chat
      GroupChatNotification: {
        include: {
          GroupChatNotificationRecipient: {
            include: { groupMember: true }, // Explicitly include groupMember information
            where: { groupMember: { userId } }, // Filter only notifications for the user with id
          },
        },
      },
    },
  });
  console.log("returned single groupchat", group);
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
  getGroupMembers,
  groupNotification,
  groupMemberNotis,
  getGroupWithNotifications,
  deleteGroupNotification,
  deleteAllGroupNotifs,
};
