import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  deleteMessage,
  postMediaMessage,
  postMessage,
  updateMessage,
} from "../controllers/messageController.js";
const messageRouter = Router();

messageRouter.post("/", authenticateToken, postMessage);
messageRouter.post("/media", authenticateToken, postMediaMessage);
messageRouter.delete("/:messageId", authenticateToken, deleteMessage);
messageRouter.put("/:messageId", authenticateToken, updateMessage);

export { messageRouter };
