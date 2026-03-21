const { createNotification } = require('../services/notificationHelper');
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Service = require("../models/Service");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { sendEmail } = require("../services/emailService");

// ✅ SERVICE REQUEST KARO
// POST /api/transactions/create
router.post("/create", protect, async (req, res) => {
    try {
        const { serviceId, message } = req.body;

        // Service dhundho
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Apni service book nahi kar sakte
        if (service.provider.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Aap apni khud ki service book nahi kar sakte" });
        }

        // Credits check karo
        const requester = await User.findById(req.user._id);
        if (requester.timeCredits < service.hoursRequired) {
            return res.status(400).json({
                message: `Kam credits hain! Chahiye: ${service.hoursRequired}, Aapke paas: ${requester.timeCredits}`
            });
        }

        // Transaction banao
        const transaction = await Transaction.create({
            requester: req.user._id,
            provider: service.provider,
            service: serviceId,
            hoursSpent: service.hoursRequired,
            message: message || "",
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
          
        // Provider ko notification
        createNotification({
            recipientId: service.provider,
            senderId: req.user._id,
            type: 'booking_request',
            title: 'Naya Booking Request! 🔔',
            body: `${requester.name} ne "${service.title}" book karna chahta hai`,
            actionUrl: '/transactions',
        });
        return res.status(201).json(transaction);

    } catch (error) {
        console.error("Transaction Create Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ REQUEST ACCEPT KARO
// PUT /api/transactions/accept/:id
router.put("/accept/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Provider ID se check karo — role se nahi
        if (transaction.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Sirf provider accept kar sakta hai" });
        }

        if (transaction.status !== "pending") {
            return res.status(400).json({ message: "Yeh transaction already processed hai" });
        }

        transaction.status = "accepted";
        await transaction.save();

        // ✅ Requester ko confirmation email
        const requester = await User.findById(transaction.requester);
        const provider = await User.findById(transaction.provider);
        const service = await Service.findById(transaction.service);
        sendEmail(requester.email, 'bookingConfirmation', {
            requesterName: requester.name,
            providerName: provider.name,
            serviceName: service.title,
            scheduledDate: new Date().toLocaleDateString('en-IN'),
            credits: transaction.hoursSpent,
            bookingId: transaction._id,
        }).catch(err => console.error('Confirmation email failed:', err.message));
  
        // Requester ko notification
        createNotification({
            recipientId: transaction.requester,
            senderId: req.user._id,
            type: 'booking_accepted',
            title: 'Booking Accept Ho Gayi! ✅',
            body: `Tumhari booking accept ho gayi`,
            actionUrl: '/transactions',
        });
        return res.json({
            message: "Transaction accepted! ✅",
            transaction
        });

    } catch (error) {
        console.error("Accept Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ TRANSACTION COMPLETE KARO — CREDITS TRANSFER HOGA
// PUT /api/transactions/complete/:id
router.put("/complete/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.status !== "accepted") {
            return res.status(400).json({ message: "Pehle transaction accept hona chahiye" });
        }

        // Dono ko notification
        createNotification({
            recipientId: transaction.requester,
            senderId: transaction.provider,
            type: 'credit_deducted',
            title: `💸 ${transaction.hoursSpent} Credits Deducted`,
            body: `Service complete — credits deduct ho gaye`,
            actionUrl: '/credits',
        });

        createNotification({
            recipientId: transaction.provider,
            senderId: transaction.requester,
            type: 'credit_earned',
            title: `💰 ${transaction.hoursSpent} Credits Earned!`,
            body: `Service complete — credits mil gaye`,
            actionUrl: '/credits',
        });

        // Complete mark karo
        transaction.status = "completed";
        transaction.completedAt = new Date();
        await transaction.save();

        // 💰 Credits Transfer:
        // Requester ke credits kam karo
        await User.findByIdAndUpdate(transaction.requester, {
            $inc: { timeCredits: -transaction.hoursSpent }
        });

        // Provider ke credits badhao
        await User.findByIdAndUpdate(transaction.provider, {
            $inc: { timeCredits: +transaction.hoursSpent }
        });

        // Service bookings count badhao
        await Service.findByIdAndUpdate(transaction.service, {
            $inc: { totalBookings: 1 }
        });

        // ✅ Updated balances fetch karo email ke liye
        const requester = await User.findById(transaction.requester);
        const provider = await User.findById(transaction.provider);
        const service = await Service.findById(transaction.service);

        // ✅ Requester ko credits deducted email
        sendEmail(requester.email, 'creditAlert', {
            userName: requester.name,
            type: 'deducted',
            amount: transaction.hoursSpent,
            reason: `Service "${service.title}" complete hua — ${transaction.hoursSpent} credits deducted`,
            newBalance: requester.timeCredits,
        }).catch(err => console.error('Credit deduct email failed:', err.message));

        // ✅ Provider ko credits earned email
        sendEmail(provider.email, 'creditAlert', {
            userName: provider.name,
            type: 'earned',
            amount: transaction.hoursSpent,
            reason: `Service "${service.title}" complete hua — ${transaction.hoursSpent} credits earned`,
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
            message: `Transaction complete! ${transaction.hoursSpent} credits transfer ho gaye ✅`,
            transaction
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ TRANSACTION CANCEL KARO
// PUT /api/transactions/cancel/:id
router.put("/cancel/:id", protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Sirf requester ya provider cancel kar sakta hai
        const isRequester = transaction.requester.toString() === req.user._id.toString();
        const isProvider = transaction.provider.toString() === req.user._id.toString();

        if (!isRequester && !isProvider) {
            return res.status(403).json({ message: "Not authorized" });
        }

        if (transaction.status === "completed") {
            return res.status(400).json({ message: "Completed transaction cancel nahi ho sakta" });
        }

        transaction.status = "cancelled";
        await transaction.save();

        return res.json({ message: "Transaction cancelled", transaction });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ MERI SAARI TRANSACTIONS DEKHO
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