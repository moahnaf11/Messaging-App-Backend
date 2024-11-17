import { prisma } from "./prismaClient.js";

const getUser = async (username = null, id = null) => {
  if (username) {
    const userUsername = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    console.log("get user", userUsername);
    return userUsername;
  }
  const userUsername = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  console.log("get user", userUsername);
  return userUsername;
};

const addUser = async (
  firstname,
  lastname,
  username,
  email,
  hashedPassword
) => {
  const useremail = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  const userUsername = await getUser(username);

  if (useremail) {
    return { error: "email already exists" };
  } else if (userUsername) {
    return { error: "username already exists" };
  }

  const user = await prisma.user.create({
    data: {
      firstname: firstname,
      lastname: lastname,
      email: email,
      username: username,
      password: hashedPassword,
    },
  });

  console.log("new user created", user);
  return user;
};

const updateUser = async (id, firstname, lastname, email, bio) => {
  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      firstname: firstname,
      lastname: lastname,
      email: email,
      status: bio,
    },
  });
  console.log("updated user", user);

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

const deleteUserAccount = async (id) => {
  const user = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  console.log("deleted user", user);
  return user;
};

export { addUser, getUser, updateUser, updateUserPassword, deleteUserAccount };
