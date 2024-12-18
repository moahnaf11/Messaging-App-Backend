import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { userRouter } from "./routes/userRouter.js";
import { profileRouter } from "./routes/profileRouter.js";
import { friendRouter } from "./routes/friendRouter.js";
import { messageRouter } from "./routes/messageRouter.js";

const users = {};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  // Listen for message send requests
  socket.on("login", (userId) => {
    users[userId] = socket.id;
    console.log("all users connected", users);
  });

  // submitting message
  socket.on("sendMessage", (messageData) => {
    const { content, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveMessage", messageData);
    } else {
      // If receiver is offline, store the message in the database for later retrieval
      console.log(`Receiver ${receiverId} is offline, message saved.`);
    }
  });

  // send media message
  socket.on("sendMediaMessage", (messageData) => {
    const { data, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveMediaMessage", data);
      console.log("media message sent to " + receiverId, data);
    } else {
      // If receiver is offline, store the message in the database for later retrieval
      console.log(`Receiver ${receiverId} is offline, message saved.`);
    }
  });

  // delete message
  socket.on("deleteMessage", (messageData) => {
    const { data, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveDeleteMessage", data);
      console.log("message deleted sent to " + receiverId, data);
    } else {
      // If receiver is offline, delete from db
      console.log(`Receiver ${receiverId} is offline, message deleted.`);
    }
  });

  // update message
  socket.on("updateMessage", (messageData) => {
    const { data, receiverId } = messageData;
    // Check if the receiver is connected
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      // If the receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveUpdateMessage", data);
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

  // Handle disconnect (clean up socketId)
  socket.on("disconnect", () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        console.log(`User with ID ${userId} disconnected`);
        break;
      }
    }
    console.log("all users after disconnection", users);
  });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);
app.use("/profile", profileRouter);
app.use("/friend", friendRouter);
app.use("/message", messageRouter);

app.use((err, req, res, next) => {
  console.log("ERROR", err);
  const statusCode = err.status || 500;
  res
    .status(statusCode)
    .json({ error: err.message || "Internal server error" });
});

export { server, app };
