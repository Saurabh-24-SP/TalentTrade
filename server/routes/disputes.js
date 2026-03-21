const express = require("express");
const router = express.Router();
const { Dispute } = require("../models/Others");
const Transaction = require("../models/Transaction");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ✅ DISPUTE UTHAO
// POST /api/disputes/raise
router.post("/raise", protect, async (req, res) => {
    try {
        const { againstUserId, transactionId, reason } = req.body;

        if (!againstUserId || !transactionId || !reason) {
            return res.status(400).json({ message: "Sab fields required hain" });
        }

        const dispute = await Dispute.create({
            raisedBy: req.user._id,
            againstUser: againstUserId,
            transaction: transactionId,
            reason,
        });

        // Transaction disputed mark karo
        await Transaction.findByIdAndUpdate(transactionId, {
            status: "disputed"
        });

        return res.status(201).json(dispute);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ SAARE DISPUTES DEKHO — SIRF ADMIN
// GET /api/disputes/all
router.get("/all", protect, adminOnly, async (req, res) => {
    try {
        const disputes = await Dispute.find()
            .populate("raisedBy", "name email")
            .populate("againstUser", "name email")
            .populate("transaction")
            .sort({ createdAt: -1 });

        return res.json(disputes);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ DISPUTE RESOLVE KARO — SIRF ADMIN
// PUT /api/disputes/resolve/:id
router.put("/resolve/:id", protect, adminOnly, async (req, res) => {
    try {
        const { adminNote } = req.body;

        const dispute = await Dispute.findByIdAndUpdate(
            req.params.id,
            {
                status: "resolved",
                adminNote: adminNote || "",
                resolvedAt: new Date(),
            },
            { new: true }
        );

        if (!dispute) {
            return res.status(404).json({ message: "Dispute not found" });
        }

        return res.json(dispute);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;