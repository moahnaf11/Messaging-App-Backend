import { body, validationResult } from "express-validator";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { handleUpload, runMiddleware } from "../utils/cloudinaryConfig.js";
import {
  addUser,
  deleteUserAccount,
  getUser,
  updateUser,
  updateUserPassword,
  uploadProfilePic,
} from "../prisma/userQueries.js";
import { passport } from "../utils/passportConfig.js";
import jwt from "jsonwebtoken";
import { upload } from "../utils/multerConfig.js";

const registerFormValidation = [
  body("firstname").notEmpty().withMessage("First name can't be empty"),
  body("lastname").notEmpty().withMessage("Last name can't be empty"),
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("email").isEmail().withMessage("Enter a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("confirmpassword")
    .isLength({ min: 6 })
    .withMessage("Confirm password must be at least 6 characters long")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password and confirm password do not match");
      }
      return true;
    }),
];

const loginFormValidation = [
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

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

const registerUser = [
  registerFormValidation,
  expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { firstname, lastname, username, email, password, confirmpassword } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const addedUser = await addUser(
      firstname,
      lastname,
      username,
      email,
      hashedPassword
    );
    if (addedUser.error) {
      return res.status(400).json({ error: addedUser.error });
    }
    return res.status(201).json(addedUser);
  }),
];

const loginUser = [
  loginFormValidation,
  expressAsyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info.message });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Send token to client
      res.status(200).json({ token });
    })(req, res, next);
  }),
];

const getUserProfile = expressAsyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
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

const changePassword = [
  passwordFormValidation,
  expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { id } = req.user;
    const user = await getUser(id);
    const { password } = req.body;
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await updateUserPassword(id, hashedPassword);
      return res.status(200).json(user);
    }
    return res.status(400).json({ error: "incorrect password" });
  }),
];

const deleteUser = async (req, res) => {
  const { id } = req.user;
  const user = await deleteUserAccount(id);
  if (user) {
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "failed to delete" });
};

const uploadPhoto = async (req, res) => {
  try {
    await runMiddleware(req, res, upload.single("profilepic"));
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI, req.params.id);
    console.log("cldRes", cldRes);
    const user = await uploadProfilePic(req.params.id, cldRes.secure_url);
    return res.status(200).json(cldRes);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: error.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUser,
  uploadPhoto,
};
