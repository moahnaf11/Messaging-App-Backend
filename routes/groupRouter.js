import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  addMember,
  createGroup,
  deleteGroup,
  getGroups,
  getSingleGroup,
  removeMember,
} from "../controllers/groupController.js";

const groupRouter = Router();

groupRouter
  .route("/")
  .post(authenticateToken, createGroup)
  .get(authenticateToken, getGroups);

groupRouter
  .route("/:id")
  .get(authenticateToken, getSingleGroup)
  .delete(authenticateToken, deleteGroup);
groupRouter.post("/:id/add-member", authenticateToken, addMember);
groupRouter.delete("/:id/remove-member", authenticateToken, removeMember);
export { groupRouter };
