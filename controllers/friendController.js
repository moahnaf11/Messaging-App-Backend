import {
  archiveUnarchiveChat,
  cancelRequest,
  checkFriendRecord,
  deleteNotifications,
  getFriends,
  getRequests,
  handleBlockUser,
  sendPostFriendRequest,
  updateRequestStatus,
} from "../prisma/friendQueries.js";
import { getUser } from "../prisma/userQueries.js";

const getAllFriends = async (req, res) => {
  const { id } = req.user;
  const friends = await getFriends(id);
  if (friends.length) {
    return res.status(200).json(friends);
  }
  return res.status(404).json({ error: "no friends found" });
};

const postRequest = async (req, res) => {
  const { id } = req.user;
  const { username } = req.body;
  const user = await getUser(username);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const record = await checkFriendRecord(user.id, id);
  if (record) {
    if (record.status !== "blocked") {
      return res.status(400).json({ error: "could not sent friend request" });
    } else if (record.status === "blocked" && record.blocker_id !== id) {
      return res
        .status(400)
        .json({ error: "You have been blocked by the user" });
    }
    return res.status(400).json({ error: "You have blocked this user" });
  }
  const friend = await sendPostFriendRequest(id, user.id);
  if (friend) {
    return res.status(201).json(friend);
  }
  return res.status(400).json({
    error: "failed to send friend request",
  });
};

const getAllRequests = async (req, res) => {
  const { id } = req.user;
  const friends = await getRequests(id);
  if (friends.length) {
    return res.status(200).json(friends);
  }
  return res.status(404).json({ error: "no pending friend requests" });
};

const acceptRejectRequest = async (req, res) => {
  const validStatuses = ["accepted", "rejected"];
  const id = req.params.id;
  const userId = req.user.id;
  const { handleRequest } = req.body;
  if (!validStatuses.includes(handleRequest)) {
    return res.status(400).json({ error: "invalid handleRequest value" });
  }
  const friend = await updateRequestStatus(id, handleRequest, userId);
  if (friend) {
    return res.status(200).json(friend);
  }
};

const deleteFriendRequest = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const friend = await cancelRequest(id, userId);
  if (friend) {
    return res.status(200).json(friend);
  }
  return res.status(400).json({ error: "failed to delete the friend request" });
};

const blockUser = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const validData = ["blocked", "accepted"];
  const { handleBlock } = req.body;
  if (!validData.includes(handleBlock)) {
    return res.status(400).json({
      error: "incorrect data type for handleBlock variable",
    });
  }
  if (handleBlock === "blocked") {
    const friend = await handleBlockUser(id, userId, handleBlock);
    if (friend) {
      return res.status(200).json(friend);
    }
  }

  const friend = await handleBlockUser(id, null, handleBlock);
  if (friend) {
    return res.status(200).json(friend);
  }
};

const archiveUnarchive = async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const userId = req.user.id;
  const { action } = req.body;
  const chat = await archiveUnarchiveChat(id, userId, action);
  if (chat) {
    return res.status(200).json(chat);
  } else {
    return res.status(400).json({ error: "failed to changed chat display" });
  }
};

const deleteNotis = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const notifications = await deleteNotifications(id, userId);
  if (notifications) {
    return res.status(200).json(notifications);
  }
  return res.status(400).json({ error: "failed to delete notifications" });
};

export {
  postRequest,
  getAllRequests,
  acceptRejectRequest,
  deleteFriendRequest,
  blockUser,
  getAllFriends,
  archiveUnarchive,
  deleteNotis,
};
