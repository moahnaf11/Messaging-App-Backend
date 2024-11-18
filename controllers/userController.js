import { body, validationResult } from "express-validator";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import {
  handleUpload,
  runMiddleware,
  cloudinary,
} from "../utils/cloudinaryConfig.js";
import {
  addUser,
  deleteUserAccount,
  getProfilePic,
  getToken,
  getUser,
  updateProfilePic,
  updateResetPasswordToken,
  updateUser,
  updateUserPassword,
  updateUserResetToken,
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

const deleteUserProfilePic = async (req, res) => {
  const profilePic = await getProfilePic(req.params.id);
  if (profilePic) {
    await deletePhoto(req.params.id, profilePic.public_id);
    const user = await updateProfilePic(req.params.id, null, null);
    return res.status(200).json(user);
  }
  return res.status(400).json({ error: "no profile pic to delete" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await getUser(null, null, email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a reset token and expiration time
    const resetToken = uuidv4();
    await updateResetPasswordToken(email, resetToken);

    // Send the reset link to the user's email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
      },
    });

    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `<p>Hi ${user.firstname},</p>
             <p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>If you did not request this, please ignore this email.</p>
             <p>Here is your reset token please provide this in the token field ${resetToken}</p>`,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await getToken(token);

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await updateUserResetToken(user.id, hashedPassword);

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
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
  deleteUserProfilePic,
  forgotPassword,
  resetPassword,
};
