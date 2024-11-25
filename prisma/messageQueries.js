import { prisma } from "./prismaClient.js";

const uploadMessageWithMedia = async (
  id,
  receiverId,
  content,
  uploadedMedia
) => {
  const message = await prisma.message.create({
    data: {
      content: content,
      receiverId: receiverId,
      senderId: id,
      media: {
        create: uploadedMedia.map((media) => ({
          public_id: media.public_id,
          type: media.resource_type,
          url: media.secure_url,
          uploadedById: id,
        })),
      },
    },
    include: {
      media: true,
    },
  });
  console.log("message created with media", message);

  return message;
};

const uploadMessage = async (id, receiverId, content) => {
  const message = await prisma.message.create({
    data: {
      content: content,
      senderId: id,
      receiverId: receiverId,
    },
  });
  console.log("message with no media", message);
  return message;
};

export { uploadMessageWithMedia, uploadMessage };
