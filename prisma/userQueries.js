import { prisma } from "./prismaClient.js";

const getUser = async (username = null, id = null, email = null) => {
  if (username) {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });
    console.log("get user", user);
    return user;
  } else if (id) {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    console.log("get user", user);
    return user;
  } else {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    console.log("get user", user);
    return user;
  }
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

const updateResetPasswordToken = async (email, resetToken) => {
  // Set token and expiration in the database
  const user = await prisma.user.update({
    where: { email },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour from now
    },
  });
  console.log("updated reset password token", user);
  return user;
};

const getToken = async (token) => {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gte: new Date(),
      },
    },
  });
  console.log("token for resetting password", user);
  return user;
};

const updateUserResetToken = async (id, hashedPassword) => {
  const user = await prisma.user.update({
    where: { id: id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  console.log("resetted user tokens", user);
  return user;
};

export {
  addUser,
  getUser,
  getToken,
  updateResetPasswordToken,
  updateUserResetToken,
};
