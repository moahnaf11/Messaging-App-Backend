import {
  cancelRequest,
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
  const { handleRequest } = req.body;
  if (!validStatuses.includes(handleRequest)) {
    return res.status(400).json({ error: "invalid handleRequest value" });
  }
  const friend = await updateRequestStatus(id, handleRequest);
  if (friend) {
    return res.status(200).json(friend);
  }
};

const deleteFriendRequest = async (req, res) => {
  const id = req.params.id;
  const friend = await cancelRequest(id);
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

export {
  postRequest,
  getAllRequests,
  acceptRejectRequest,
  deleteFriendRequest,
  blockUser,
  getAllFriends,
};
