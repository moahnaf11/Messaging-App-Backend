import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
const messageRouter = Router();

messageRouter.post("/", authenticateToken, postMessage);

export { messageRouter };
