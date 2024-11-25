import {
  uploadMessage,
  uploadMessageWithMedia,
} from "../prisma/messageQueries.js";
import { runMiddleware, handleUpload } from "../utils/cloudinaryConfig.js";
import { multipleUpload } from "../utils/multerConfig.js";

const postMessage = async (req, res) => {
  const { id } = req.user;
  const { receiverId, content } = req.body;
  if (!id || !receiverId) {
    return res
      .status(400)
      .json({ error: "Sender and receiver IDs are required." });
  }
  await runMiddleware(req, res, multipleUpload.array("media", 5));
  if (req.files && req.files.length) {
    const uploadedMedia = [];
    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;
      const cldRes = await handleUpload(dataURI, null, id);
      console.log("message file", cldRes);
      uploadedMedia.push(cldRes);
    }
    console.log("all uploaded files", uploadedMedia);
    // add it to the database
    const message = await uploadMessageWithMedia(
      id,
      receiverId,
      content,
      uploadedMedia
    );

    return res.status(200).json(message);
  } else {
    // no files just text added to database
    const message = await uploadMessage(id, receiverId, content);
    return res.status(200).json(message);
  }
};

export { postMessage };
