import { upload } from "../utils/multerConfig.js";
import { body, validationResult } from "express-validator";
import { handleUpload, runMiddleware } from "../utils/cloudinaryConfig.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import {
  deletePhoto,
  deleteImageFromCloudinary,
  deleteRawFromCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/helperfunctions.js";
import {
  getProfilePic,
  updateProfilePic,
  updateUserPassword,
  updateUser,
  updateOnline,
  deleteUserAccount,
} from "../prisma/profileQueries.js";
import { getUser } from "../prisma/userQueries.js";
import { cloudinary } from "../utils/cloudinaryConfig.js";
import multer from "multer";

const passwordFormValidation = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("newpassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("confirmnewpassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newpassword) {
        throw new Error("Password and confirm password do not match");
      }
      return true;
    }),
];

const changePassword = [
  passwordFormValidation,
  expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { id } = req.user;
    const user = await getUser(null, id);
    if (!user) {
      return res
        .status(404)
        .json({ error: "couldnt change password, user does not exist" });
    }
    const { password, newpassword } = req.body;
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const hashedPassword = await bcrypt.hash(newpassword, 10);
      const user = await updateUserPassword(id, hashedPassword);
      return res.status(200).json(user);
    }
    return res.status(400).json({ error: "Enter your current password" });
  }),
];

const uploadPhoto = async (req, res) => {
  try {
    const profilePic = await getProfilePic(req.params.id);
    if (profilePic) {
      await deletePhoto(req.params.id, profilePic.public_id);
    }
    // catch multer error
    try {
      await runMiddleware(req, res, upload.single("profilepic"));
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
              .json({ error: "You can only upload 1 file" });
          default:
            return res
              .status(400)
              .json({ error: `Multer error: ${err.message}` });
        }
      } else if (
        err.message === "Invalid file type. Only JPEG, JPG, PNG allowed"
      ) {
        return res.status(400).json({ error: err.message });
      }
    }
    console.log(req.file);
    if (!req.file) {
      return res.status(400).json({ error: "No file was provided" });
    }
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI, req.params.id, "profilepic");
    console.log("cldRes", cldRes);
    const user = await updateProfilePic(
      req.params.id,
      cldRes.secure_url,
      cldRes.public_id
    );
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: error.message,
    });
  }
};

const getUserProfile = expressAsyncHandler(async (req, res) => {
  const user = await getUser(null, req.params.id);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(404).json({ error: "user not found" });
});

const updateUserProfile = expressAsyncHandler(async (req, res) => {
  const { id } = req.user;
  const { firstname, lastname, username, email, bio } = req.body;
  const user = await updateUser(id, firstname, lastname, username, email, bio);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "failed to update user" });
});

const deleteUser = async (req, res) => {
  const { id } = req.user;
  const userMedia = await getUser(null, id);
  // delete user profile photo from cloudinary if exists
  if (userMedia.public_id) {
    const result = await cloudinary.uploader.destroy(userMedia.public_id);
    console.log(result);
    if (result.result === "ok") {
      console.log("successfully deleted profile photo from cloudinary");
    }
  }
  // filter all images and videos anw raw files by resource type
  const imgArray = userMedia.media
    .filter((media) => media.type === "image")
    .map((media) => media.public_id);

  const videoArray = userMedia.media
    .filter((media) => media.type === "video")
    .map((media) => media.public_id);

  const rawArray = userMedia.media
    .filter((media) => media.type !== "image" && media.type !== "video")
    .map((media) => media.public_id);
  await Promise.all([
    imgArray.length ? deleteImageFromCloudinary(imgArray) : Promise.resolve(),
    videoArray.length
      ? deleteVideoFromCloudinary(videoArray)
      : Promise.resolve(),
    rawArray.length ? deleteRawFromCloudinary(rawArray) : Promise.resolve(),
  ]);

  const user = await deleteUserAccount(id);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "failed to delete user record" });
};

const deleteUserProfilePic = async (req, res) => {
  const profilePic = await getProfilePic(req.params.id);
  if (profilePic) {
    await deletePhoto(req.params.id, profilePic.public_id);
    const user = await updateProfilePic(req.params.id, null, null);
    return res.status(200).json(user);
  }
  return res.status(404).json({ error: "no profile pic to delete" });
};

const updateOnlineStatus = async (req, res) => {
  const onlineStatus = req.body.online;
  const user = await updateOnline(req.params.id, onlineStatus);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "failed to update user status" });
};

export {
  changePassword,
  uploadPhoto,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  deleteUserProfilePic,
  updateOnlineStatus,
};
