import {
  addMemberToGroup,
  allGroups,
  archiveUnarchiveGroup,
  createGroupChat,
  deleteAllGroupNotifs,
  deleteGroupNotification,
  deletingGroup,
  editAdmin,
  findMemberInGroup,
  getGroupPicture,
  getGroupWithNotifications,
  removeUserFromGroup,
  singleGroup,
  updateGroupName,
  updateGroupPic,
  updateMemberRole,
} from "../prisma/groupQueries.js";
import { getUser } from "../prisma/userQueries.js";
import { runMiddleware, handleUpload } from "../utils/cloudinaryConfig.js";
import { deleteGroupPhotoFromCloudinary } from "../utils/helperfunctions.js";
import { upload } from "../utils/multerConfig.js";
import multer from "multer";

const createGroup = async (req, res) => {
  const myId = req.user.id;
  const { name, creatorId, members } = req.body;
  if (!name || !creatorId || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ message: "Invalid group data" });
  }
  const group = await createGroupChat(name, creatorId, members, myId);
  if (group) {
    return res.status(201).json(group);
  }
  return res.status(404).json({ error: "failed to create group" });
};

const getGroups = async (req, res) => {
  const { id } = req.user;
  const groups = await allGroups(id);
  if (groups.length) {
    return res.status(200).json(groups);
  }
  return res.status(404).json({ error: "no groups found" });
};

const getSingleGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const group = await singleGroup(id, userId);
  if (group) {
    return res.status(200).json(group);
  }
  return res.status(404).json({ error: "failed to find group by id" });
};

const addMember = async (req, res) => {
  const { id } = req.params; // Group ID
  const { username, role = "member" } = req.body; // User ID to add
  const user = await getUser(username);
  if (user) {
    const inGroup = await findMemberInGroup(id, user.id);
    if (inGroup) {
      return res.status(400).json({ error: "user is already a member" });
    }
  } else {
    return res.status(404).json({ error: "user not found" });
  }

  const group = await addMemberToGroup(user.id, id, role);
  if (group) {
    return res.status(201).json(group);
  }
  return res.status(400).json({ error: "failed to add member" });
};

const removeMember = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body; // User to remove

  const groupMember = await removeUserFromGroup(id, userId);
  if (groupMember) {
    return res.status(200).json(groupMember);
  }
  return res.status(400).json({ error: "failed to remove user from group" });
};

const deleteGroup = async (req, res) => {
  const { id } = req.params;

  const group = await deletingGroup(id);
  if (group) {
    return res.status(200).json(group);
  }
  return res.status(400).json({
    error: "failed to delete group",
  });
};

const updateRole = async (req, res) => {
  const { id } = req.params;
  const { memberId, role } = req.body; // User role to update
  const groupMember = await updateMemberRole(id, memberId, role);
  if (groupMember) {
    return res.status(200).json(groupMember);
  }
  return res.status(400).json({ error: "failed to update group member role" });
};

const uploadGroupPhoto = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const groupPicture = await getGroupPicture(id);
  if (groupPicture.public_id) {
    // delete group Picture
    await deleteGroupPhotoFromCloudinary(groupPicture.public_id);
  }
  try {
    await runMiddleware(req, res, upload.single("groupImage"));
  } catch (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      switch (err.code) {
        case "LIMIT_FILE_SIZE":
          return res
            .status(400)
            .json({ error: "File size exceeds the limit of 2MB." });
        case "LIMIT_FILE_COUNT":
          return res.status(400).json({ error: "You can only upload 1 file" });
        default:
          return res
            .status(400)
            .json({ error: `Multer error: ${err.message}` });
      }
    } else if (
      err.message === "Invalid file type. Only JPEG, JPG, PNG allowed"
    ) {
      return res.status(400).json({ error: err.message });
    }
  }
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file was provided" });
  }
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  const cldRes = await handleUpload(dataURI, id, "groupPic", req.file.mimetype);
  console.log("groupPicRes", cldRes);
  const group = await updateGroupPic(
    id,
    cldRes.secure_url,
    cldRes.public_id,
    userId
  );
  return res.status(200).json(group);
};

const deleteGroupPhoto = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const groupPicture = await getGroupPicture(id);
  await deleteGroupPhotoFromCloudinary(groupPicture.public_id);
  const group = await updateGroupPic(id, null, null, userId);
  return res.status(200).json(group);
};

const updateName = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name } = req.body;
  const group = await updateGroupName(id, name, userId);
  if (group) {
    return res.status(200).json(group);
  } else {
    return res.status(400).json({ error: "failed to update group name" });
  }
};

const updateAdminOnly = async (req, res) => {
  const { id } = req.params;
  const { newMode } = req.body;
  const group = await editAdmin(id, newMode);
  if (group) {
    return res.status(200).json(group);
  }
  return res.status(400).json({ error: "failed to update admin only mode" });
};

const archiveGroup = async (req, res) => {
  const { id } = req.params;
  const userid = req.user.id;
  const { action } = req.body;
  const group = await archiveUnarchiveGroup(id, userid, action);
  if (group) {
    return res.status(200).json(group);
  }
  return res
    .status(400)
    .json({ error: "failed to archive group chat for user" });
};

const getgroupNotis = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const group = await getGroupWithNotifications(id, userId);
  if (group) {
    return res.status(200).json(group);
  }
  return res.status(400), json({ error: "failed to get group with notis" });
};

const deleteSingleGroupNoti = async (req, res) => {
  const { notificationId } = req.body;
  const userId = req.user.id;
  const noti = await deleteGroupNotification(userId, notificationId);
  if (noti) {
    return res.status(200).json(noti);
  }
  return res
    .status(400)
    .json({ error: "failed to delete single notification" });
};

const deleteGroupNotis = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notifs = await deleteAllGroupNotifs(userId, id);
  if (notifs) {
    return res.status(200).json(notifs);
  }
  return res
    .status(400)
    .json({ error: "failed to delete all group chat notis for user" });
};
export {
  createGroup,
  getGroups,
  getSingleGroup,
  addMember,
  removeMember,
  deleteGroup,
  updateRole,
  uploadGroupPhoto,
  deleteGroupPhoto,
  updateName,
  updateAdminOnly,
  archiveGroup,
  getgroupNotis,
  deleteSingleGroupNoti,
  deleteGroupNotis,
};
