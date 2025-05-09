import { prisma } from "./prismaClient.js";

const getProfilePic = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!user.profilePicture) {
    return null;
  }
  return user;
};

const updateProfilePic = async (id, url, publicId) => {
  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      profilePicture: url,
      public_id: publicId,
    },
  });
  console.log("updated user profile picture", user);
  return user;
};

const updateUserPassword = async (id, hashedPassword) => {
  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      password: hashedPassword,
    },
  });
  console.log("updated user password", user);
  return user;
};

const updateUser = async (id, firstname, lastname, username, email, bio) => {
  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      firstname: firstname,
      lastname: lastname,
      username: username,
      email: email,
      status: bio,
    },
  });
  console.log("updated user", user);

  return user;
};

const deleteUserAccount = async (id) => {
  // // const friends = await prisma.friend.deleteMany({
  // //   where: {
  // //     OR: [{ requesterId: id }, { requesteeId: id }],
  // //   },
  // // });
  // console.log("deleted all friend records where deleted user exists", friends);
  const user = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  console.log("deleted user", user);
  return user;
};

const updateOnline = async (id, onlineStatus) => {
  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      showOnlineStatus: onlineStatus,
    },
  });

  console.log("updated user online status", user);
  return user;
};

const updateUserOnline = async (id, boolvalue) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    console.log("User not found, skipping update:", id);
    return null; // Exit the function if the user doesn't exist
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      online: boolvalue,
    },
  });
  console.log("updated users socket online", user);
  return user;
};

export {
  updateProfilePic,
  getProfilePic,
  updateUserPassword,
  updateUser,
  deleteUserAccount,
  updateOnline,
  updateUserOnline,
};
