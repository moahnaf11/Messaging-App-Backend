import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  changePassword,
  deleteUser,
  deleteUserProfilePic,
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
  uploadPhoto,
} from "../controllers/userController.js";
const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/profile/:id/change-password", changePassword);
userRouter.put("/profile/:id/upload-photo", authenticateToken, uploadPhoto);
userRouter.get("/profile/:id", authenticateToken, getUserProfile);
userRouter.put("/profile/:id", authenticateToken, updateUserProfile);
userRouter.delete("/profile/:id", authenticateToken, deleteUser);
userRouter.delete(
  "/profile/:id/upload-photo",
  authenticateToken,
  deleteUserProfilePic
);

export { userRouter };
