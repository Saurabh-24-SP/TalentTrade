const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { setSocketIO } = require('./services/notificationHelper');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
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

// Health check
app.get("/", (req, res) => res.send("TalentTradeServer Running ✅"));

// Socket.io — Real-time Chat
const onlineUsers = new Map();
io.on("connection", (socket) => {
    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room`);
    });
    console.log("User connected:", socket.id);

    socket.on("user_online", (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("send_message", (data) => {
        const receiverSocket = onlineUsers.get(data.receiverId);
        if (receiverSocket) {
            io.to(receiverSocket).emit("receive_message", data);
        }
    });

    socket.on("disconnect", () => {
        onlineUsers.forEach((id, userId) => {
            if (id === socket.id) onlineUsers.delete(userId);
        });
        io.emit("online_users", Array.from(onlineUsers.keys()));
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
setSocketIO(io);