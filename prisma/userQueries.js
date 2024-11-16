import { prisma } from "./prismaClient.js";

const addUser = async (username, email, hashedPassword) => {
  const useremail = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  const userUsername = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (useremail) {
    return { error: "email already exists" };
  } else if (userUsername) {
    return { error: "username already exists" };
  }

  const user = await prisma.user.create({
    data: {
      email: email,
      username: username,
      password: hashedPassword,
    },
  });

  console.log("new user created", user);
  return user;
};

export { addUser };
