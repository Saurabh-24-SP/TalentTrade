const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Service = require("../models/Service");
const Transaction = require("../models/Transaction");
const { Dispute } = require("../models/Others");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ✅ DASHBOARD STATS
// GET /api/admin/dashboard
router.get("/dashboard", protect, adminOnly, async (req, res) => {
    try {
        const [totalUsers, totalServices, totalTransactions, openDisputes] =
            await Promise.all([
                User.countDocuments(),
                Service.countDocuments(),
                Transaction.countDocuments(),
                Dispute.countDocuments({ status: "open" }),
            ]);

        return res.json({
            totalUsers,
            totalServices,
            totalTransactions,
            openDisputes,
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ VIEW ALL USERS
// GET /api/admin/users
router.get("/users", protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        return res.json(users);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ VERIFY USER
// PUT /api/admin/verify/:id
router.put("/verify/:id", protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json(user);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ BAN USER
// PUT /api/admin/ban/:id
router.put("/ban/:id", protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned: true },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json(user);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/stats — Real-time stats for home page
router.get("/stats", async (req, res) => {
    try {
        const User = require("../models/User");
        const Service = require("../models/Service");
        const Transaction = require("../models/Transaction");
        const { Review } = require("../models/Others");

        const [totalUsers, totalServices, totalTransactions, reviews] = await Promise.all([
            User.countDocuments({ isBanned: false }),
            Service.countDocuments({ isActive: true }),
            Transaction.countDocuments({ status: "completed" }),
            Review.find({}, { rating: 1 }),
        ]);

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 4.9;

        res.json({
            success: true,
            totalUsers,
            totalServices,
            totalTransactions,
            avgRating,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = router;