const express = require("express");
const router = express.Router();
const { Message } = require("../models/Others");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ✅ LIST CHAT CONTACTS (non-admin)
// GET /api/messages/contacts
router.get("/contacts", protect, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } })
            .select("name role avatar")
            .sort({ name: 1 });

        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ VIEW MESSAGES
// GET /api/messages/:userId
router.get("/:userId", protect, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id },
            ],
        }).sort({ createdAt: 1 });

        return res.json(messages);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ SEND MESSAGE
// POST /api/messages/send
router.post("/send", protect, async (req, res) => {
    try {
        const { receiverId, text } = req.body;

        if (!receiverId || !text) {
            return res.status(400).json({ message: "ReceiverId and text are required" });
        }

        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            text,
        });

        return res.status(201).json(message);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ MARK MESSAGE AS READ
// PUT /api/messages/read/:userId
router.put("/read/:userId", protect, async (req, res) => {
    try {
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.user._id, isRead: false },
            { isRead: true }
        );

        return res.json({ message: "Messages marked as read ✅" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;