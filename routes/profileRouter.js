import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  changePassword,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  uploadPhoto,
  deleteUserProfilePic,
  updateOnlineStatus,
} from "../controllers/profileController.js";
const profileRouter = Router();

profileRouter.post("/:id/change-password", authenticateToken, changePassword);
profileRouter.put("/:id/upload-photo", authenticateToken, uploadPhoto);
profileRouter.delete(
  "/:id/upload-photo",
  authenticateToken,
  deleteUserProfilePic
);
profileRouter.put("/:id/online-status", authenticateToken, updateOnlineStatus);
profileRouter.get("/:id", authenticateToken, getUserProfile);
profileRouter.put("/:id", authenticateToken, updateUserProfile);
profileRouter.delete("/:id", authenticateToken, deleteUser);

export { profileRouter };
