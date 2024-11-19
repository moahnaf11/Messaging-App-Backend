import { upload } from "../utils/multerConfig.js";
import { body, validationResult } from "express-validator";
import { handleUpload, runMiddleware } from "../utils/cloudinaryConfig.js";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import {
  getProfilePic,
  updateProfilePic,
  updateUserPassword,
  updateUser,
  deleteUserAccount,
} from "../prisma/profileQueries.js";
import { getUser } from "../prisma/userQueries.js";
import { cloudinary } from "../utils/cloudinaryConfig.js";

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

const deletePhoto = async (id, publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  console.log(result);
  if (result.result === "ok") {
    console.log("successfully deleted from cloudinary");
    const user = await updateProfilePic(id, null, null);
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const profilePic = await getProfilePic(req.params.id);
    if (profilePic) {
      await deletePhoto(req.params.id, profilePic.public_id);
    }
    await runMiddleware(req, res, upload.single("profilepic"));
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI, req.params.id);
    console.log("cldRes", cldRes);
    const user = await updateProfilePic(
      req.params.id,
      cldRes.secure_url,
      cldRes.public_id
    );
    return res.status(200).json(cldRes);
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
  const user = await deleteUserAccount(id);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "failed to delete" });
};

const deleteUserProfilePic = async (req, res) => {
  const profilePic = await getProfilePic(req.params.id);
  if (profilePic) {
    await deletePhoto(req.params.id, profilePic.public_id);
    const user = await updateProfilePic(req.params.id, null, null);
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "no profile pic to delete" });
};

export {
  changePassword,
  uploadPhoto,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  deleteUserProfilePic,
};