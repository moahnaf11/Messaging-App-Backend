import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  postMediaMessage,
  postMessage,
} from "../controllers/messageController.js";
const messageRouter = Router();

messageRouter.post("/", authenticateToken, postMessage);
messageRouter.post("/media", authenticateToken, postMediaMessage);

export { messageRouter };
