import { Router } from "express";
import { authenticateToken } from "../utils/authenticateToken.js";
import {
  addMember,
  archiveGroup,
  createGroup,
  deleteGroup,
  deleteGroupNotis,
  deleteGroupPhoto,
  deleteSingleGroupNoti,
  getgroupNotis,
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
groupRouter.delete("/noti/delete", authenticateToken, deleteSingleGroupNoti);
groupRouter
  .route("/:id/upload-photo")
  .put(authenticateToken, uploadGroupPhoto)
  .delete(authenticateToken, deleteGroupPhoto);
groupRouter.put("/:id/archive", authenticateToken, archiveGroup);
groupRouter.put("/:id/admin-only", authenticateToken, updateAdminOnly);
groupRouter.put("/:id/role", authenticateToken, updateRole);
groupRouter.post("/:id/add-member", authenticateToken, addMember);
groupRouter.delete("/:id/remove-member", authenticateToken, removeMember);
groupRouter.get("/:id/group-notis", authenticateToken, getgroupNotis);
groupRouter.delete("/:id/delete-notifications", authenticateToken, deleteGroupNotis)
export { groupRouter };
