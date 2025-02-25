import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { userRouter } from "./routes/userRouter.js";
import { profileRouter } from "./routes/profileRouter.js";
import { friendRouter } from "./routes/friendRouter.js";
import { messageRouter } from "./routes/messageRouter.js";
import { groupRouter } from "./routes/groupRouter.js";
import {
  allGroups,
  getGroupMembers,
  groupMemberNotis,
  groupNotification,
  singleGroup,
} from "./prisma/groupQueries.js";
import { updateUserOnline } from "./prisma/profileQueries.js";
import { friendNotification } from "./prisma/friendQueries.js";

const users = {};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Your frontend URL
    methods: ["GET", "POST"], // Allowed methods
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  // Listen for message send requests
  socket.on("login", async (userId) => {
    const groups = await allGroups(userId);
    users[userId] = socket.id;
    console.log("all users connected", users);
    groups.forEach((group) => {
      socket.join(group.id);
      console.log(`User ${userId} joined room: ${group.id}`);
    });
    const data = await updateUserOnline(userId, true);
    socket.broadcast.emit("receiveOnline", data);
  });

  // submitting message
  socket.on("sendMessage", async (messageData) => {
    const { content, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    const notification = await friendNotification(
      messageData.content.senderId,
      messageData.content.friendId,
      receiverId
    );
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveMessage", messageData);
      console.log("message sent to", receiverId);
      // save message to notifications
      io.to(receiverSocketId).emit("receiveFriendNotification", notification);
    } else {
      // If receiver is offline, store the message in the database for later retrieval
      console.log(`Receiver ${receiverId} is offline, message saved.`);
    }
  });

  // socket.on("joinGroups", (groupIds) => {
  //   groupIds.forEach((groupId) => {
  //     socket.join(groupId);
  //     console.log(`User ${socket.id} joined room: ${groupId}`);
  //   });
  // });

  // sending group message
  socket.on("sendGroupMessage", async ({ content, groupId, senderId }) => {
    // Send the message to all members in the room except the sender
    socket.to(groupId).emit("receiveGroupMessage", {
      content,
      senderId,
      groupId,
    });
    const members = await getGroupMembers(groupId, senderId);
    const notification = await groupNotification(groupId, senderId);
    const recipientData = members.map((member) => ({
      notificationId: notification.id, // Reference notification
      groupMemberId: member.id, // Assign to this group member
    }));

    const eachNoti = await groupMemberNotis(recipientData);

    socket.to(groupId).emit("receiveGroupNotification", {
      senderId,
      groupId,
      notification: notification.id,
    });
  });

  // send group media message
  socket.on("sendMediaMessageGroup", async (messageData) => {
    const { data, groupId, senderId } = messageData;
    // Emit the updated message to everyone in the room except the sender
    socket.to(groupId).emit("receiveGroupMediaMessage", { data, groupId });
    const members = await getGroupMembers(groupId, senderId);
    const notification = await groupNotification(groupId, senderId);
    const recipientData = members.map((member) => ({
      notificationId: notification.id, // Reference notification
      groupMemberId: member.id, // Assign to this group member
    }));

    const eachNoti = await groupMemberNotis(recipientData);

    socket.to(groupId).emit("receiveGroupNotification", {
      senderId,
      groupId,
      notification: notification.id,
    });
  });

  // send media message
  socket.on("sendMediaMessage", async (messageData) => {
    const { data, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    const notification = await friendNotification(
      data.senderId,
      data.friendId,
      receiverId
    );
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveMediaMessage", messageData);
      console.log("media message sent to " + receiverId, data);
      io.to(receiverSocketId).emit("receiveFriendNotification", notification);
    } else {
      // If receiver is offline, store the message in the database for later retrieval
      console.log(`Receiver ${receiverId} is offline, message saved.`);
    }
  });

  // delete group message
  socket.on("deleteGroupMessage", (messageData) => {
    const { data, groupId, senderId } = messageData;
    // Emit the updated message to everyone in the room except the sender
    socket.to(groupId).emit("receiveDeleteGroupMessage", { data, groupId });
  });

  // delete message
  socket.on("deleteMessage", (messageData) => {
    const { data, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveDeleteMessage", messageData);
      console.log("message deleted sent to " + receiverId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${receiverId} is offline, message deleted.`);
    }
  });

  // update group message
  socket.on("updateGroupMessage", (messageData) => {
    const { data, groupId, senderId } = messageData;
    // Emit the updated message to everyone in the room except the sender
    socket.to(groupId).emit("receiveUpdatedGroupMessage", { data, groupId });
  });

  // update message
  socket.on("updateMessage", (messageData) => {
    const { data, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveUpdateMessage", messageData);
      console.log("message updated sent to " + receiverId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${receiverId} is offline, message updated.`);
    }
  });

  // Listen for `updateOnlineStatus` from the client
  socket.on("updateOnline", (data) => {
    // Broadcast the update to all other connected users
    socket.broadcast.emit("receiveOnline", data);
  });

  // send friend req
  socket.on("sendFriendReq", (data) => {
    const { requesteeId } = data;
    // Check if the receiver is connected
    const receiverSocketId = users[requesteeId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveFriendReq", data);
      console.log("friend req sent to " + requesteeId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${requesteeId} is offline, friend req sent`);
    }
  });

  // reject request
  socket.on("rejectRequest", (data) => {
    const { requesterId } = data;
    // Check if the receiver is connected
    const receiverSocketId = users[requesterId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveRejectRequest", data);
      console.log("friend req rejected sent to " + requesterId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${requesterId} is offline, friend req rejected`);
    }
  });

  // cancel request
  socket.on("cancelRequest", (data) => {
    const { requesteeId } = data;
    // Check if the receiver is connected
    const receiverSocketId = users[requesteeId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveRejectRequest", data);
      console.log("friend req canceled sent to " + requesteeId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${requesteeId} is offline, friend req canceled`);
    }
  });

  // accept friend request
  socket.on("acceptReq", (data) => {
    const { requesterId } = data;
    // Check if the receiver is connected
    const receiverSocketId = users[requesterId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveAcceptReq", data);
      console.log("friend req accepted sent to " + requesterId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${requesterId} is offline, friend req accepted`);
    }
  });

  // delete friend
  socket.on("deleteFriend", (friend) => {
    const { id, data } = friend;
    // Check if the receiver is connected
    const receiverSocketId = users[id];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveDeleteFriend", data);
      console.log("friend removed sent to " + id, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${id} is offline, friend removed`);
    }
  });

  // create group
  socket.on("createGroup", (info) => {
    const { data, creatorId } = info;
    // Emit the event to all group members except the creator
    data.members.forEach((member) => {
      if (users[member.userId]) {
        // join the member to the group room
        io.sockets.sockets.get(users[member.userId]).join(data.id);
        console.log(`user ${member.userId} joined room`);
        if (member.userId !== creatorId) {
          io.to(users[member.userId]).emit("groupCreated", data);
        }
      }
    });
  });

  // block user
  socket.on("blockuser", (friend) => {
    const { id, data } = friend;
    // Check if the receiver is connected
    const receiverSocketId = users[id];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveBlockUser", data);
      console.log("friend blocked sent to " + id, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${id} is offline, friend blocked`);
    }
  });

  // delete user account
  socket.on("deleteAccount", (data) => {
    socket.broadcast.emit("receiveDeleteAccount", data);
    console.log("user deleted sent to everyone " + data);
  });

  // remove member from group
  socket.on("removeMember", async (data) => {
    const { groupId, userId } = data;
    const group = await singleGroup(groupId);
    if (users[userId]) {
      // Remove the user from the group room
      io.sockets.sockets.get(users[userId]).leave(groupId);
      console.log(`User ${users[userId]} removed from room: ${groupId}`);
      io.to(users[userId]).emit("receiveRemoveMember", { group, userId });
    }
    socket.to(groupId).emit("updateGroupInfo", group);
  });

  // add user to group
  socket.on("addMember", async (data) => {
    const { groupId, userId } = data;
    const group = await singleGroup(groupId, userId);
    if (users[userId]) {
      io.to(users[userId]).socketsJoin(groupId);
      console.log("new member joined the room:", groupId);
      io.to(users[userId]).emit("receiveAddMember", group);
    }
    socket.to(groupId).emit("updateGroupInfo", group);
  });

  // delete group
  socket.on("groupDeleted", ({ groupId }) => {
    socket.to(groupId).emit("receiveDeleteGroup", groupId);
  });

  // update group member role
  socket.on("updateMemberRole", (data) => {
    const { groupId } = data;
    socket.to(groupId).emit("receiveMemberRole", data);
  });

  // update group photo
  socket.on("updateGroupPhoto", (data) => {
    socket.to(data.id).emit("receiveUpdateGroupPhoto", data);
  });

  // toggle only admin texting mode
  socket.on("toggleAdminChat", (data) => {
    socket.to(data.id).emit("receiveOnlyAdminMode", data);
  });

  // Handle disconnect (clean up socketId)
  socket.on("disconnect", async () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        const data = await updateUserOnline(userId, false);
        delete users[userId];
        console.log(`User with ID ${userId} disconnected`);
        if (data) {
          socket.broadcast.emit("receiveOnline", data);
        }
        break;
      }
    }
    console.log("all users after disconnection", users);
  });
});

// Configure CORS to allow requests only from the frontend URL
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods if needed
    credentials: true, // Allow cookies or authentication headers if necessary
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);
app.use("/profile", profileRouter);
app.use("/friend", friendRouter);
app.use("/message", messageRouter);
app.use("/group", groupRouter);

app.use((err, req, res, next) => {
  console.log("ERROR", err);
  const statusCode = err.status || 500;
  res
    .status(statusCode)
    .json({ error: err.message || "Internal server error" });
});

export { server, app };
