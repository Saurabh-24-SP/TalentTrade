const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// GET /api/notifications — all notifications
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { recipient: req.user._id };
        if (req.query.unreadOnly === 'true') filter.read = false;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .populate('sender', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipient: req.user._id, read: false }),
        ]);

        res.json({
            success: true,
            notifications,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            unreadCount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/notifications/unread-count
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            read: false,
        });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { read: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true, readAt: new Date() }
        );
        res.json({ success: true, message: 'All notifications marked as read ✅' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id,
        });
        res.json({ success: true, message: 'Notification deleted ✅' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/notifications/clear-all
router.delete('/clear-all', protect, async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.json({ success: true, message: 'All notifications cleared ✅' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;