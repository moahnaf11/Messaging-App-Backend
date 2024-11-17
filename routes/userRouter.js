import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  changePassword,
  deleteUser,
  getUserProfile,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../controllers/userController.js";
const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/profile/:id/change-password", changePassword);
userRouter.get("/profile/:id", authenticateToken, getUserProfile);
userRouter.put("/profile/:id", authenticateToken, updateUserProfile);
userRouter.delete("/profile/:id", authenticateToken, deleteUser);
export { userRouter };
