const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { setSocketIO } = require('./services/notificationHelper');

dotenv.config({ path: path.resolve(__dirname, ".env") });
connectDB();

const app = express();
const server = http.createServer(app);

// CORS configuration for development and production
const allowedOrigins = [
    ...new Set(
        [
            ...(process.env.ALLOW_ORIGINS || "").split(","),
            process.env.FRONTEND_URL,
            process.env.CLIENT_URL,
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "https://talenttrade.saurabhtech.in",
        ].filter(Boolean).map((origin) => origin.trim())
    ),
];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

const io = new Server(server, {
    cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Routes — sabhi ek jagah
app.use("/api/auth", require("./routes/auth"));
app.use("/api/services", require("./routes/services"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/disputes", require("./routes/disputes"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use("/api/dashboard", require("./routes/dashboard"));

// Health check
app.get("/", (req, res) => res.send("TalentTradeServer Running ✅"));

// Socket.io — Real-time Chat
const userSockets = new Map(); // userId -> Set(socketId)
const socketToUser = new Map(); // socketId -> userId

const emitOnlineUsers = () => {
    io.emit("online_users", Array.from(userSockets.keys()));
};

const registerUserSocket = (socket, userId) => {
    if (!userId) return;
    const id = String(userId);

    const previousUserId = socketToUser.get(socket.id);
    if (previousUserId && previousUserId !== id && userSockets.has(previousUserId)) {
        const previousSet = userSockets.get(previousUserId);
        previousSet.delete(socket.id);
        if (previousSet.size === 0) userSockets.delete(previousUserId);
    }

    socket.join(`user_${id}`);
    socketToUser.set(socket.id, id);

    const existing = userSockets.get(id) || new Set();
    existing.add(socket.id);
    userSockets.set(id, existing);
    emitOnlineUsers();
};
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on('join_user_room', (userId) => {
        registerUserSocket(socket, userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on("user_online", (userId) => {
        registerUserSocket(socket, userId);
    });

    socket.on("send_message", (data) => {
        if (!data?.receiverId) return;
        io.to(`user_${data.receiverId}`).emit("receive_message", data);
    });

    // ─── WebRTC Meeting Signaling (per-service rooms) ─────────────────────────
    socket.on("meeting:join", ({ roomId, userId } = {}) => {
        if (!roomId) return;
        const safeRoomId = String(roomId);
        socket.join(safeRoomId);
        socket.emit("meeting:joined", { roomId: safeRoomId, socketId: socket.id });
        socket.to(safeRoomId).emit("meeting:peer-joined", {
            roomId: safeRoomId,
            socketId: socket.id,
            userId: userId ? String(userId) : null,
        });
    });

    socket.on("meeting:leave", ({ roomId } = {}) => {
        if (!roomId) return;
        const safeRoomId = String(roomId);
        socket.leave(safeRoomId);
        socket.to(safeRoomId).emit("meeting:peer-left", { roomId: safeRoomId, socketId: socket.id });
    });

    socket.on("meeting:offer", ({ to, from, sdp, roomId } = {}) => {
        if (!to || !sdp) return;
        io.to(String(to)).emit("meeting:offer", {
            to: String(to),
            from: from ? String(from) : socket.id,
            sdp,
            roomId: roomId ? String(roomId) : null,
        });
    });

    socket.on("meeting:answer", ({ to, from, sdp, roomId } = {}) => {
        if (!to || !sdp) return;
        io.to(String(to)).emit("meeting:answer", {
            to: String(to),
            from: from ? String(from) : socket.id,
            sdp,
            roomId: roomId ? String(roomId) : null,
        });
    });

    socket.on("meeting:ice-candidate", ({ to, from, candidate, roomId } = {}) => {
        if (!to || !candidate) return;
        io.to(String(to)).emit("meeting:ice-candidate", {
            to: String(to),
            from: from ? String(from) : socket.id,
            candidate,
            roomId: roomId ? String(roomId) : null,
        });
    });

    socket.on("disconnect", () => {
        const userId = socketToUser.get(socket.id);
        socketToUser.delete(socket.id);
        if (userId && userSockets.has(userId)) {
            const set = userSockets.get(userId);
            set.delete(socket.id);
            if (set.size === 0) userSockets.delete(userId);
        }
        emitOnlineUsers();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
setSocketIO(io);