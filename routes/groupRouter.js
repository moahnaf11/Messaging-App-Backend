import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  addMember,
  archiveGroup,
  createGroup,
  deleteGroup,
  deleteGroupPhoto,
  getGroups,
  getSingleGroup,
  removeMember,
  updateAdminOnly,
  updateName,
  updateRole,
  uploadGroupPhoto,
} from "../controllers/groupController.js";

const groupRouter = Router();

groupRouter
  .route("/")
  .post(authenticateToken, createGroup)
  .get(authenticateToken, getGroups);

groupRouter
  .route("/:id")
  .get(authenticateToken, getSingleGroup)
  .delete(authenticateToken, deleteGroup)
  .put(authenticateToken, updateName);
groupRouter
  .route("/:id/upload-photo")
  .put(authenticateToken, uploadGroupPhoto)
  .delete(authenticateToken, deleteGroupPhoto);
groupRouter.put("/:id/archive", authenticateToken, archiveGroup);
groupRouter.put("/:id/admin-only", authenticateToken, updateAdminOnly);
groupRouter.put("/:id/role", authenticateToken, updateRole);
groupRouter.post("/:id/add-member", authenticateToken, addMember);
groupRouter.delete("/:id/remove-member", authenticateToken, removeMember);
export { groupRouter };
