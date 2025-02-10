import {
  addMemberToGroup,
  allGroups,
  createGroupChat,
  deletingGroup,
  removeUserFromGroup,
  singleGroup,
} from "../prisma/groupQueries.js";

const createGroup = async (req, res) => {
  const { name, creatorId, members } = req.body;
  if (!name || !creatorId || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ message: "Invalid group data" });
  }
  const group = await createGroupChat(name, creatorId, members);
  if (group) {
    return res.status(201).json(group);
  }
  return res.status(404).json({ error: "failed to create group" });
};

const getGroups = async (req, res) => {
  const groups = await allGroups();
  if (groups.length) {
    return res.status(200).json(groups);
  }
  return res.status(404).json({ error: "no groups found" });
};

const getSingleGroup = async (req, res) => {
  const { id } = req.params;
  const group = await singleGroup(id);
  if (group) {
    return res.status(200).json(group);
  }
  return res.status(404).json({ error: "failed to find group by id" });
};

const addMember = async (req, res) => {
  const { id } = req.params; // Group ID
  const { userId, role = "member" } = req.body; // User ID to add

  const group = await addMemberToGroup(userId, id, role);
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

export {
  createGroup,
  getGroups,
  getSingleGroup,
  addMember,
  removeMember,
  deleteGroup,
};
