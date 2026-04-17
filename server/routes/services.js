const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Transaction = require("../models/Transaction");
const Request = require("../models/Request");
const SavedService = require("../models/SavedService");
const User = require("../models/User");
const { Review } = require("../models/Others");
const { protect } = require("../middleware/authMiddleware");
const { createNotification } = require("../services/notificationHelper");
const { sendEmail } = require("../services/emailService");
const jwt = require("jsonwebtoken");

const getOptionalUserId = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    try {
        const token = authHeader.split(" ")[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return payload.id;
    } catch (error) {
        return null;
    }
};

const buildAvailability = (availability = {}) => ({
    mode: availability.mode || "flexible",
    days: Array.isArray(availability.days) ? availability.days : [],
    hours: Array.isArray(availability.hours) ? availability.hours : [],
    note: availability.note || "",
});

const buildLiveMeeting = (liveMeeting = {}) => ({
    available: Boolean(liveMeeting.available),
    platform: typeof liveMeeting.platform === "string" ? liveMeeting.platform.trim() : "",
    note: typeof liveMeeting.note === "string" ? liveMeeting.note.trim() : "",
});

// ✅ GET ALL SERVICES
// GET /api/services/all
router.get("/all", async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        const query = { status: "active" };

        if (category) query.category = category;
        if (search) query.title = { $regex: search, $options: "i" };

        const services = await Service.find(query)
            .populate("provider", "name rating timeCredits")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Service.countDocuments(query);

        return res.json({
            services,
            total,
            pages: Math.ceil(total / limit),
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ GET SINGLE SERVICE
// GET /api/services/:id
router.get("/:id/reviews", async (req, res) => {
    try {
        const reviews = await Review.find({ service: req.params.id })
            .populate("reviewer", "name avatar")
            .sort({ createdAt: -1 });

        return res.json(reviews);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// GET /api/services/:id
router.get("/:id", async (req, res) => {
    try {
        const userId = getOptionalUserId(req);
        const service = await Service.findById(req.params.id)
            .populate("provider", "name rating bio skills timeCredits avatar location totalReviews");

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const [completedJobsCount, reviewCount, similarServices, isSaved] = await Promise.all([
            Transaction.countDocuments({ provider: service.provider._id, status: "completed" }),
            Review.countDocuments({ service: service._id }),
            Service.find({
                _id: { $ne: service._id },
                provider: { $ne: service.provider._id },
                status: "active",
                $or: [
                    { category: service.category },
                    { tags: { $in: service.tags || [] } },
                ],
            })
                .populate("provider", "name rating avatar")
                .sort({ totalBookings: -1, createdAt: -1 })
                .limit(4),
            userId ? SavedService.exists({ user: userId, service: service._id }) : false,
        ]);

        const payload = service.toObject();
        payload.availability = buildAvailability(payload.availability);
        payload.providerStats = {
            completedJobsCount,
            reviewCount,
        };
        payload.similarServices = similarServices;
        payload.isSaved = Boolean(isSaved);

        return res.json(payload);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// POST /api/services/:id/request
router.post("/:id/request", protect, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (service.provider.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot book your own service" });
        }

        const requester = await User.findById(req.user._id);
        if (!requester) {
            return res.status(404).json({ message: "Requester not found" });
        }

        if (requester.timeCredits < service.hoursRequired) {
            return res.status(400).json({
                message: `Not enough credits! Required: ${service.hoursRequired}, You have: ${requester.timeCredits}`,
            });
        }

        const transaction = await Transaction.create({
            requester: req.user._id,
            provider: service.provider,
            service: service._id,
            hoursSpent: service.hoursRequired,
            message: req.body.message || "",
        });

        await Request.create({
            requester: req.user._id,
            provider: service.provider,
            service: service._id,
            transaction: transaction._id,
            message: req.body.message || "",
            hoursRequested: service.hoursRequired,
            status: "pending",
        });

        const provider = await User.findById(service.provider);

        sendEmail(provider.email, "bookingRequest", {
            providerName: provider.name,
            requesterName: requester.name,
            serviceName: service.title,
            scheduledDate: new Date().toLocaleDateString("en-IN"),
            credits: service.hoursRequired,
            bookingId: transaction._id,
        }).catch((err) => console.error("Booking request email failed:", err.message));

        createNotification({
            recipientId: service.provider,
            senderId: req.user._id,
            type: "booking_request",
            title: "New Booking Request! 🔔",
            body: `${requester.name} wants to book "${service.title}"`,
            actionUrl: "/transactions",
        });

        return res.status(201).json({
            success: true,
            message: "Service requested successfully",
            transaction,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// POST /api/services/:id/meeting-invite
// Creates a real-time notification for the service provider with a Join Meeting link.
router.post("/:id/meeting-invite", protect, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate("provider", "name");
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (String(service.provider?._id) === String(req.user._id)) {
            return res.status(400).json({ message: "You cannot invite yourself" });
        }

        const requester = await User.findById(req.user._id).select("name");

        await createNotification({
            recipientId: service.provider._id,
            senderId: req.user._id,
            type: "meeting_invite",
            title: "Video Meeting Invite 📹",
            body: `${requester?.name || "Someone"} started a meeting for "${service.title}". Tap to join.`,
            actionUrl: `/services/${service._id}/meeting`,
            data: {
                serviceId: String(service._id),
                roomId: `service_${service._id}`,
            },
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// POST /api/services/:id/save
router.post("/:id/save", protect, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const existing = await SavedService.findOne({ user: req.user._id, service: service._id });
        if (existing) {
            return res.json({ success: true, saved: true, message: "Service already saved" });
        }

        await SavedService.create({ user: req.user._id, service: service._id });

        return res.status(201).json({ success: true, saved: true, message: "Service saved" });
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ success: true, saved: true, message: "Service already saved" });
        }
        return res.status(500).json({ message: error.message });
    }
});

// ✅ CREATE SERVICE
// POST /api/services/create
router.post("/create", protect, async (req, res) => {
    try {
        const { title, description, category, hoursRequired, tags, location, image, images, availability, videoUrl, liveMeeting } = req.body;

        if (!title || !description || !category || !hoursRequired) {
            return res.status(400).json({ message: "Title, description, category, hoursRequired required" });
        }

        const service = await Service.create({
            provider: req.user._id,
            title,
            description,
            category,
            hoursRequired,
            tags: tags || [],
            location: location || {},
            image: image || "",
            images: Array.isArray(images) ? images : [],
            availability: buildAvailability(availability),
            videoUrl: typeof videoUrl === "string" ? videoUrl.trim() : "",
            liveMeeting: buildLiveMeeting(liveMeeting),
        });

        return res.status(201).json(service);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ UPDATE SERVICE
// PUT /api/services/update/:id
router.put("/update/:id", protect, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Only you can update your own service
        if (service.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updated = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        return res.json(updated);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ DELETE SERVICE
// DELETE /api/services/delete/:id
router.delete("/delete/:id", protect, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Only you can delete your own service
        if (service.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await service.deleteOne();
        return res.json({ message: "Service deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ GET MY SERVICES
// GET /api/services/my/listings
router.get("/my/listings", protect, async (req, res) => {
    try {
        const services = await Service.find({ provider: req.user._id })
            .sort({ createdAt: -1 });
        return res.json(services);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;