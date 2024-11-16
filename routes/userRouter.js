import { Router } from "express";
import { registerUser } from "../controllers/userController.js";
const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login");

export { userRouter };
