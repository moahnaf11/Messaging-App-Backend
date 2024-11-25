import { runMiddleware, handleUpload } from "../utils/cloudinaryConfig";
import { multipleUpload } from "../utils/multerConfig";

const postMessage = async (req, res) => {
  const { id } = req.user;
  const { receiverId, content, media } = req.body;
  if (!id || !receiverId) {
    return res
      .status(400)
      .json({ error: "Sender and receiver IDs are required." });
  }
  if (media.length) {
    const uploadedMedia = [];
    await runMiddleware(req, res, multipleUpload.array("files", 5));
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const cldRes = await handleUpload(dataURI, req.params.id, id);
        console.log("message file", cldRes);
        uploadedMedia.push(cldRes);
      }
      console.log("all uploaded files", uploadedMedia);
      return res.status(200).json(uploadedMedia);
    }
  } else {
    // no files just text add to database
  }
};

export { postMessage };
