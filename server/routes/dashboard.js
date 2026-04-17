const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Service = require("../models/Service");
const Request = require("../models/Request");

const monthlyWindow = 6;

router.get("/stats", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, pendingRequests, acceptedRequests, completedAsProvider, completedAsRequester] =
      await Promise.all([
        User.findById(userId).select("timeCredits"),
        Request.countDocuments({ $or: [{ requester: userId }, { provider: userId }], status: "pending" }),
        Request.countDocuments({ $or: [{ requester: userId }, { provider: userId }], status: "accepted" }),
        Transaction.find({ provider: userId, status: "completed" }).select("hoursSpent"),
        Transaction.find({ requester: userId, status: "completed" }).select("hoursSpent"),
      ]);

    const totalEarnings = completedAsProvider.reduce((sum, tx) => sum + (tx.hoursSpent || 0), 0);
    const completedServices = completedAsProvider.length + completedAsRequester.length;

    const now = new Date();
    const monthlyCredits = [];

    for (let i = monthlyWindow - 1; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [earnedTx, spentTx] = await Promise.all([
        Transaction.find({
          provider: userId,
          status: "completed",
          completedAt: { $gte: start, $lt: end },
        }).select("hoursSpent"),
        Transaction.find({
          requester: userId,
          status: "completed",
          completedAt: { $gte: start, $lt: end },
        }).select("hoursSpent"),
      ]);

      monthlyCredits.push({
        month: start.toLocaleString("en-US", { month: "short" }),
        earned: earnedTx.reduce((sum, tx) => sum + (tx.hoursSpent || 0), 0),
        spent: spentTx.reduce((sum, tx) => sum + (tx.hoursSpent || 0), 0),
      });
    }

    return res.json({
      credits: user?.timeCredits || 0,
      pendingRequests,
      acceptedRequests,
      completedServices,
      totalEarnings,
      monthlyCredits,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/activity", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [recentTransactions, upcomingMeetings] = await Promise.all([
      Transaction.find({
        $or: [{ requester: userId }, { provider: userId }],
      })
        .populate("service", "title category hoursRequired")
        .populate("requester", "name")
        .populate("provider", "name")
        .sort({ createdAt: -1 })
        .limit(8),
      Request.find({
        $or: [{ requester: userId }, { provider: userId }],
        status: "accepted",
      })
        .populate("service", "title category")
        .populate("requester", "name")
        .populate("provider", "name")
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    return res.json({ recentTransactions, upcomingMeetings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/recommendations", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("skills");
    const skills = user?.skills || [];

    const query = {
      status: "active",
      provider: { $ne: req.user._id },
    };

    if (skills.length) {
      query.$or = [
        { tags: { $in: skills } },
        { title: { $regex: skills.join("|"), $options: "i" } },
        { description: { $regex: skills.join("|"), $options: "i" } },
      ];
    }

    const suggestedServices = await Service.find(query)
      .populate("provider", "name rating")
      .sort({ totalBookings: -1, createdAt: -1 })
      .limit(6);

    return res.json({ suggestedServices });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
