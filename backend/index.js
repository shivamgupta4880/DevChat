const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:3000",
  "https://dev-chat-wine.vercel.app"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(...process.env.FRONTEND_URL.split(","));
}

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// DB Connection
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("DevChat Server is running 🚀");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory map: socketId -> { userId, name }
const onlineUsers = new Map();

// Helper: get all online users in a room
function getRoomUsers(room) {
  const roomSockets = io.sockets.adapter.rooms.get(room);
  if (!roomSockets) return [];
  const users = [];
  roomSockets.forEach((socketId) => {
    const user = onlineUsers.get(socketId);
    if (user) users.push(user);
  });
  return users;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user identity on connection
  socket.on("register_user", ({ userId, name }) => {
    onlineUsers.set(socket.id, { userId, name, socketId: socket.id });
  });

  socket.on("join_room", (channel) => {
    // Leave old rooms first
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    socket.join(channel);
    console.log(`User ${socket.id} joined channel: ${channel}`);
    // Broadcast updated online users list to the room
    io.to(channel).emit("users_online", getRoomUsers(channel));
  });

  socket.on("send_message", async (data) => {
    const Message = require('./model/Message');
    try {
      const newMessage = new Message({
        sender: data.senderId,
        channel: data.channel,
        text: data.text
      });
      await newMessage.save();
      await newMessage.populate('sender', 'name email');
      io.to(data.channel).emit("receive_message", newMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("typing", (data) => {
    socket.to(data.channel).emit("user_typing", data.name);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.channel).emit("user_stop_typing", data.name);
  });

  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    console.log("User disconnected:", socket.id, user?.name);
    onlineUsers.delete(socket.id);
    // Notify all rooms this socket was in
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        io.to(room).emit("users_online", getRoomUsers(room));
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`DevChat server started on port ${PORT} 🚀`);
});