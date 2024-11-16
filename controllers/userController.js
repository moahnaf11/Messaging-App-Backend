import { body, validationResult } from "express-validator";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { addUser } from "../prisma/userQueries.js";

const registerFormValidation = [
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

const registerUser = [
  registerFormValidation,
  expressAsyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { username, email, password, confirmpassword } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const addedUser = await addUser(username, email, hashedPassword);
    if (addedUser.error) {
      return res.status(400).json({ error: addedUser.error });
    }
    return res.status(201).json(addedUser);
  }),
];

export { registerUser };
