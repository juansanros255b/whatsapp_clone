const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://whatsapp-clone-sepia-three.vercel.app";

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Static files for uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// ─── Multer – file upload ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// ─── REST: file upload endpoint ───────────────────────────────────────────────
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const isImage = req.file.mimetype.startsWith("image/");
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    isImage,
    url: `/uploads/${req.file.filename}`,
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true }));

// ─── Socket.IO server ─────────────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

// In-memory state
const users = new Map(); // socketId → { id, name, status, avatar, rooms }
const rooms = new Map(); // roomName → Set of socketIds
const GENERAL_ROOM = "General";
rooms.set(GENERAL_ROOM, new Set());

const AVAILABLE_ROOMS = [
  "General",
  "Tecnología",
  "Música",
  "Deportes",
  "Cine",
  "Videojuegos",
];
AVAILABLE_ROOMS.forEach((r) => {
  if (!rooms.has(r)) rooms.set(r, new Set());
});

function getUserList() {
  return [...users.values()].map(({ id, name, status, avatar }) => ({
    id,
    name,
    status,
    avatar,
  }));
}

function getRoomList() {
  return AVAILABLE_ROOMS.map((name) => ({
    name,
    count: rooms.get(name)?.size ?? 0,
  }));
}

function broadcastUserList() {
  io.emit("userList", getUserList());
  io.emit("roomList", getRoomList());
}

io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── Register user ────────────────────────────────────────────────────────────
  socket.on("register", ({ name, status, avatar }) => {
    const user = { id: socket.id, name, status, avatar, rooms: new Set() };
    users.set(socket.id, user);

    // Auto-join General room
    socket.join(GENERAL_ROOM);
    rooms.get(GENERAL_ROOM).add(socket.id);
    user.rooms.add(GENERAL_ROOM);

    broadcastUserList();

    // Notify General room that someone joined
    io.to(GENERAL_ROOM).emit("systemMessage", {
      room: GENERAL_ROOM,
      text: `${name} se ha unido al chat`,
      timestamp: Date.now(),
    });

    // Send current room list to this socket
    socket.emit("joinedRoom", GENERAL_ROOM);
    console.log(`[register] ${name} (${socket.id})`);
  });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      // Notify all rooms the user was in
      user.rooms.forEach((room) => {
        rooms.get(room)?.delete(socket.id);
        io.to(room).emit("systemMessage", {
          room,
          text: `${user.name} ha salido del chat`,
          timestamp: Date.now(),
        });
      });
      users.delete(socket.id);
      broadcastUserList();
      console.log(`[-] ${user.name} (${socket.id}) disconnected`);
    }
  });

  // ── Room message ─────────────────────────────────────────────────────────────
  socket.on("roomMessage", ({ room, text, file }) => {
    const user = users.get(socket.id);
    if (!user) return;
    const msg = {
      id: uuidv4(),
      room,
      senderId: socket.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: text || null,
      file: file || null,
      timestamp: Date.now(),
    };
    io.to(room).emit("roomMessage", msg);
  });

  // ── Private message ──────────────────────────────────────────────────────────
  socket.on("privateMessage", ({ toId, text, file }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    const msg = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      toId,
      text: text || null,
      file: file || null,
      timestamp: Date.now(),
    };
    socket.to(toId).emit("privateMessage", msg);
    socket.emit("privateMessage", msg); // echo to sender
  });

  // ── Join room ────────────────────────────────────────────────────────────────
  socket.on("joinRoom", (roomName) => {
    const user = users.get(socket.id);
    if (!user || !AVAILABLE_ROOMS.includes(roomName)) return;
    if (!user.rooms.has(roomName)) {
      socket.join(roomName);
      rooms.get(roomName).add(socket.id);
      user.rooms.add(roomName);
      socket.emit("joinedRoom", roomName);
      broadcastUserList();
      io.to(roomName).emit("systemMessage", {
        room: roomName,
        text: `${user.name} se ha unido a #${roomName}`,
        timestamp: Date.now(),
      });
    }
  });

  // ── Leave room ───────────────────────────────────────────────────────────────
  socket.on("leaveRoom", (roomName) => {
    if (roomName === GENERAL_ROOM) return; // can't leave General
    const user = users.get(socket.id);
    if (!user || !user.rooms.has(roomName)) return;
    socket.leave(roomName);
    rooms.get(roomName)?.delete(socket.id);
    user.rooms.delete(roomName);
    socket.emit("leftRoom", roomName);
    broadcastUserList();
    io.to(roomName).emit("systemMessage", {
      room: roomName,
      text: `${user.name} ha salido de #${roomName}`,
      timestamp: Date.now(),
    });
  });

  // ── Typing in room ───────────────────────────────────────────────────────────
  socket.on("typing", ({ room, isTyping }) => {
    const user = users.get(socket.id);
    if (!user) return;
    socket.to(room).emit("typing", {
      room,
      userId: socket.id,
      userName: user.name,
      isTyping,
    });
  });

  // ── Typing in private ────────────────────────────────────────────────────────
  socket.on("typingPrivate", ({ toId, isTyping }) => {
    const user = users.get(socket.id);
    if (!user) return;
    socket.to(toId).emit("typingPrivate", {
      fromId: socket.id,
      fromName: user.name,
      isTyping,
    });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
