const { createNotification } = require('../services/notificationHelper');
const express = require("express");
const router = express.Router();
const { Review } = require("../models/Others");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ✅ REVIEW DO
// POST /api/reviews/create
router.post("/create", protect, async (req, res) => {
    try {
        const { revieweeId, serviceId, transactionId, rating, comment } = req.body;

        if (!revieweeId || !rating) {
            return res.status(400).json({ message: "RevieweeId aur rating required hai" });
        }

        const review = await Review.create({
            reviewer: req.user._id,
            reviewee: revieweeId,
            service: serviceId,
            transaction: transactionId,
            rating,
            comment: comment || "",
        });

        // Average rating update karo
        const allReviews = await Review.find({ reviewee: revieweeId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await User.findByIdAndUpdate(revieweeId, {
            rating: avgRating.toFixed(1),
            totalReviews: allReviews.length,
        });
        // Provider ko review notification
        createNotification({
            recipientId: revieweeId,
            senderId: req.user._id,
            type: 'new_review',
            title: 'Naya Review Mila! ⭐',
            body: `${req.user.name} ne tumhe ${rating} star diya`,
            actionUrl: `/profile/${revieweeId}`,
        });

        return res.status(201).json(review);

    } catch (error) {
        console.error("Review Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ KISI KI REVIEWS DEKHO
// GET /api/reviews/user/:id
router.get("/user/:id", async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.id })
            .populate("reviewer", "name avatar")
            .sort({ createdAt: -1 });

        return res.json(reviews);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;