import {
  delMessage,
  editMessage,
  getMessage,
  getMessagesByFriendId,
  uploadMessage,
  uploadMessageWithMedia,
} from "../prisma/messageQueries.js";
import { runMiddleware, handleUpload } from "../utils/cloudinaryConfig.js";
import {
  deleteImageFromCloudinary,
  deleteRawFromCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/helperfunctions.js";
import { multipleUpload } from "../utils/multerConfig.js";
import multer from "multer";

const getFriendMessages = async (req, res) => {
  const { friendId } = req.params;
  const { messages, friend } = await getMessagesByFriendId(friendId);
  if (!messages.length) {
    return res.status(404).json({ error: "no messages found", friend });
  }
  return res.status(200).json({ messages, friend });
};

const postMediaMessage = async (req, res) => {
  const { id } = req.user;
  // catch multer errors
  try {
    await runMiddleware(req, res, multipleUpload.array("media", 5));
  } catch (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          return res
            .status(400)
            .json({ error: "File size exceeds the limit of 2MB." });
        case "LIMIT_FILE_COUNT":
          return res
            .status(400)
            .json({ error: "You can only upload up to 5 files." });
        default:
          return res
            .status(400)
            .json({ error: `Multer error: ${err.message}` });
      }
    } else if (
      err.message ===
      "Invalid file type. Only JPEG, JPG, PNG, MP4, PDF and DOCX allowed"
    ) {
      // Handle custom file type errors
      return res.status(400).json({ error: err.message });
    }
  }
  if (req.files && req.files.length) {
    const { receiverId, groupChatId, content, friendId } = req.body;
    if (!id || (!receiverId && !groupChatId)) {
      return res.status(400).json({
        error: "Sender and receiver IDs/ group chat IDs are required.",
      });
    }
    const uploadedMedia = [];
    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;
      const cldRes = await handleUpload(dataURI, null, id, file.mimetype);
      console.log("message file", cldRes);
      uploadedMedia.push(cldRes);
    }
    console.log("all uploaded files", uploadedMedia);
    // add it to the database
    const message = await uploadMessageWithMedia(
      id,
      receiverId,
      groupChatId,
      content,
      uploadedMedia,
      friendId
    );

    return res.status(200).json(message);
  } else if (!req.files || !req.files.length) {
    return res.status(400).json({ error: "Please select a file to upload" });
  }
};

const postMessage = async (req, res) => {
  const { id } = req.user;
  const { receiverId, content, groupChatId, friendId } = req.body;
  if (!id || (!receiverId && !groupChatId)) {
    return res.status(400).json({
      error: "Sender and receiver IDs / group chat IDs are required.",
    });
  }
  const message = await uploadMessage(id, receiverId, groupChatId, content, friendId);
  return res.status(200).json(message);
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const message = await getMessage(messageId);
  if (message.media.length) {
    const imgArray = message.media
      .filter((file) => file.type === "image")
      .map((file) => file.public_id);
    const vidArray = message.media
      .filter((file) => file.type === "video")
      .map((file) => file.public_id);
    const rawArray = message.media
      .filter((file) => file.type === "raw")
      .map((file) => file.public_id);

    await Promise.all([
      imgArray.length ? deleteImageFromCloudinary(imgArray) : Promise.resolve(),
      vidArray.length ? deleteVideoFromCloudinary(vidArray) : Promise.resolve(),
      rawArray.length ? deleteRawFromCloudinary(rawArray) : Promise.resolve(),
    ]);
    const deletedMessage = await delMessage(messageId);
    return res.status(200).json(deletedMessage);
  }
  const deletedMessage = await delMessage(messageId);
  return res.status(200).json(deletedMessage);
};

const updateMessage = async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const message = await editMessage(messageId, content);
  if (message) {
    return res.status(200).json(message);
  }
  return res.status(400).json({ error: "failed to edit message" });
};

export {
  postMediaMessage,
  postMessage,
  deleteMessage,
  updateMessage,
  getFriendMessages,
};
