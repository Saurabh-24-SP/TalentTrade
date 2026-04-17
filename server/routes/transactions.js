const { createNotification } = require('../services/notificationHelper');
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Service = require("../models/Service");
const User = require("../models/User");
const Request = require("../models/Request");
const { protect } = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailService");

// ✅ REQUEST SERVICE
// POST /api/transactions/create
router.post("/create", protect, async (req, res) => {
    try {
        const { serviceId, message } = req.body;

        // Find service
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Cannot book own service
        if (service.provider.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot book your own service" });
        }

        // Check credits
        const requester = await User.findById(req.user._id);
        if (requester.timeCredits < service.hoursRequired) {
            return res.status(400).json({
                message: `Not enough credits! Required: ${service.hoursRequired}, You have: ${requester.timeCredits}`
            });
        }

        // Create transaction
        const transaction = await Transaction.create({
            requester: req.user._id,
            provider: service.provider,
            service: serviceId,
            hoursSpent: service.hoursRequired,
            message: message || "",
        });

        await Request.create({
            requester: req.user._id,
            provider: service.provider,
            service: serviceId,
            transaction: transaction._id,
            message: message || "",
            hoursRequested: service.hoursRequired,
            status: "pending",
        });

        // ✅ Provider ko booking request email
        const provider = await User.findById(service.provider);
        sendEmail(provider.email, 'bookingRequest', {
            providerName: provider.name,
            requesterName: requester.name,
            serviceName: service.title,
            scheduledDate: new Date().toLocaleDateString('en-IN'),
            credits: service.hoursRequired,
            bookingId: transaction._id,
        }).catch(err => console.error('Booking request email failed:', err.message));
          
        // Notification to provider
        createNotification({
            recipientId: service.provider,
            senderId: req.user._id,
            type: 'booking_request',
            title: 'New Booking Request! 🔔',
            body: `${requester.name} wants to book "${service.title}"`,
            actionUrl: '/transactions',
        });
        return res.status(201).json(transaction);

    } catch (error) {
        console.error("Transaction Create Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ ACCEPT REQUEST
// PUT /api/transactions/accept/:id
router.put("/accept/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Check by Provider ID — not role
        if (transaction.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the provider can accept" });
        }

        if (transaction.status !== "pending") {
            return res.status(400).json({ message: "This transaction is already processed" });
        }

        const [requester, provider, service] = await Promise.all([
            User.findById(transaction.requester),
            User.findById(transaction.provider),
            Service.findById(transaction.service),
        ]);

        if (!requester || !provider || !service) {
            return res.status(404).json({ message: "Related transaction data not found" });
        }

        if (requester.timeCredits < transaction.hoursSpent) {
            return res.status(400).json({
                message: `Requester has insufficient credits. Required: ${transaction.hoursSpent}, Available: ${requester.timeCredits}`,
            });
        }

        const updatedRequester = await User.findByIdAndUpdate(
            transaction.requester,
            { $inc: { timeCredits: -transaction.hoursSpent } },
            { new: true }
        );

        transaction.status = "accepted";
        transaction.creditsLocked = true;
        await transaction.save();

        await Request.findOneAndUpdate(
            { transaction: transaction._id },
            { status: "accepted" },
            { new: true }
        );

        // ✅ Requester ko confirmation email
        sendEmail(requester.email, 'bookingConfirmation', {
            requesterName: requester.name,
            providerName: provider.name,
            serviceName: service.title,
            scheduledDate: new Date().toLocaleDateString('en-IN'),
            credits: transaction.hoursSpent,
            bookingId: transaction._id,
        }).catch(err => console.error('Confirmation email failed:', err.message));

        sendEmail(requester.email, 'creditAlert', {
            userName: requester.name,
            type: 'deducted',
            amount: transaction.hoursSpent,
            reason: `Booking accepted for "${service.title}" — ${transaction.hoursSpent} credits reserved`,
            newBalance: updatedRequester.timeCredits,
        }).catch(err => console.error('Credit deduct email failed:', err.message));
  
        // Notification to requester
        createNotification({
            recipientId: transaction.requester,
            senderId: req.user._id,
            type: 'booking_accepted',
            title: 'Booking Accepted! ✅',
            body: `Your booking has been accepted`,
            data: {
                newBalance: updatedRequester.timeCredits,
                deductedCredits: transaction.hoursSpent,
            },
            actionUrl: '/transactions',
        });

        createNotification({
            recipientId: transaction.requester,
            senderId: req.user._id,
            type: 'credit_deducted',
            title: `💸 ${transaction.hoursSpent} Credits Deducted`,
            body: `Credits were deducted as soon as your booking was accepted`,
            data: {
                newBalance: updatedRequester.timeCredits,
                deductedCredits: transaction.hoursSpent,
            },
            actionUrl: '/credits',
        });
        return res.json({
            message: "Transaction accepted! ✅",
            transaction,
            requesterCredits: updatedRequester.timeCredits,
        });

    } catch (error) {
        console.error("Accept Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ COMPLETE TRANSACTION — CREDITS WILL BE TRANSFERRED
// PUT /api/transactions/complete/:id
router.put("/complete/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.status !== "accepted") {
            return res.status(400).json({ message: "Transaction must be accepted first" });
        }

        // Notify both
        createNotification({
            recipientId: transaction.requester,
            senderId: transaction.provider,
            type: 'credit_deducted',
            title: `💸 ${transaction.hoursSpent} Credits Deducted`,
            body: `Service complete — credits deducted`,
            actionUrl: '/credits',
        });

        createNotification({
            recipientId: transaction.provider,
            senderId: transaction.requester,
            type: 'credit_earned',
            title: `💰 ${transaction.hoursSpent} Credits Earned!`,
            body: `Service complete — credits earned`,
            actionUrl: '/credits',
        });

        // Mark complete
        transaction.status = "completed";
        transaction.completedAt = new Date();
        await transaction.save();

        await Request.findOneAndUpdate(
            { transaction: transaction._id },
            { status: "completed" },
            { new: true }
        );

        // 💰 Credits Transfer:
        // New flow: requester's credits are locked at accept.
        // Legacy fallback: if credits were never locked, deduct now.
        let requester;
        if (transaction.creditsLocked) {
            requester = await User.findById(transaction.requester);
        } else {
            requester = await User.findByIdAndUpdate(
                transaction.requester,
                { $inc: { timeCredits: -transaction.hoursSpent } },
                { new: true }
            );
        }

        const provider = await User.findByIdAndUpdate(
            transaction.provider,
            { $inc: { timeCredits: +transaction.hoursSpent } },
            { new: true }
        );

        // Increase service bookings count
        await Service.findByIdAndUpdate(transaction.service, {
            $inc: { totalBookings: 1 }
        });

        // ✅ Fetch updated balances for email
        const service = await Service.findById(transaction.service);

        // ✅ Provider ko credits earned email
        sendEmail(provider.email, 'creditAlert', {
            userName: provider.name,
            type: 'earned',
            amount: transaction.hoursSpent,
            reason: `Service "${service.title}" completed — ${transaction.hoursSpent} credits earned`,
            newBalance: provider.timeCredits,
        }).catch(err => console.error('Credit earn email failed:', err.message));

        // ✅ Requester ko review reminder email (5 second delay)
        setTimeout(() => {
            sendEmail(requester.email, 'reviewReminder', {
                reviewerName: requester.name,
                providerName: provider.name,
                serviceName: service.title,
                bookingId: transaction._id,
            }).catch(err => console.error('Review reminder email failed:', err.message));
        }, 5000);

        return res.json({
            message: `Transaction complete! ${transaction.hoursSpent} credits transferred ✅`,
            transaction
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ CANCEL TRANSACTION
// PUT /api/transactions/cancel/:id
router.put("/cancel/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Only requester or provider can cancel
        const isRequester = transaction.requester.toString() === req.user._id.toString();
        const isProvider = transaction.provider.toString() === req.user._id.toString();

        if (!isRequester && !isProvider) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (transaction.status === "completed") {
            return res.status(400).json({ message: "Completed transaction cannot be cancelled" });
        }

        let updatedRequester = null;
        const shouldRefundLockedCredits = transaction.status === "accepted" && transaction.creditsLocked;

        if (shouldRefundLockedCredits) {
            updatedRequester = await User.findByIdAndUpdate(
                transaction.requester,
                { $inc: { timeCredits: transaction.hoursSpent } },
                { new: true }
            );
        }

        transaction.status = "cancelled";
        if (shouldRefundLockedCredits) {
            transaction.creditsLocked = false;
        }
        await transaction.save();

        await Request.findOneAndUpdate(
            { transaction: transaction._id },
            { status: "cancelled" },
            { new: true }
        );

        if (shouldRefundLockedCredits && updatedRequester) {
            createNotification({
                recipientId: transaction.requester,
                senderId: req.user._id,
                type: 'system',
                title: `Credits Refunded ↩️`,
                body: `${transaction.hoursSpent} credits were refunded because the accepted booking was cancelled`,
                data: {
                    newBalance: updatedRequester.timeCredits,
                    refundedCredits: transaction.hoursSpent,
                },
                actionUrl: '/credits',
            });
        }

        return res.json({
            message: "Transaction cancelled",
            transaction,
            requesterCredits: updatedRequester?.timeCredits,
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ VIEW ALL MY TRANSACTIONS
// GET /api/transactions/my
router.get("/my", protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { requester: req.user._id },
                { provider: req.user._id }
            ]
        })
            .populate("service", "title hoursRequired category")
            .populate("requester", "name")
            .populate("provider", "name")
            .sort({ createdAt: -1 });

        return res.json(transactions);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;