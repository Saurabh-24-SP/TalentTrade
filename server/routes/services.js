const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const { protect } = require("../middleware/authMiddleware");

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
router.get("/:id", async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate("provider", "name rating bio skills");

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        return res.json(service);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ CREATE SERVICE
// POST /api/services/create
router.post("/create", protect, async (req, res) => {
    try {
        const { title, description, category, hoursRequired, tags, location, image } = req.body;

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

        // Sirf apni service update kar sakte ho
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

        // Sirf apni service delete kar sakte ho
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