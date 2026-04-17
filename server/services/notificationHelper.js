const Notification = require('../models/Notification');

let io; // socket.io instance

const setSocketIO = (socketIO) => {
    io = socketIO;
};

const NOTIF_CONFIG = {
    booking_request: { icon: '🔔', color: '#f59e0b' },
    booking_accepted: { icon: '✅', color: '#10b981' },
    booking_declined: { icon: '❌', color: '#ef4444' },
    booking_completed: { icon: '🎉', color: '#8b5cf6' },
    new_message: { icon: '💬', color: '#3b82f6' },
    meeting_invite: { icon: '📹', color: '#6366f1' },
    credit_earned: { icon: '💰', color: '#10b981' },
    credit_deducted: { icon: '💸', color: '#f59e0b' },
    new_review: { icon: '⭐', color: '#f59e0b' },
    service_approved: { icon: '✅', color: '#10b981' },
    fraud_alert: { icon: '🚨', color: '#ef4444' },
    system: { icon: 'ℹ️', color: '#6b7280' },
};

const createNotification = async ({ recipientId, senderId, type, title, body, data = {}, actionUrl = null }) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId || null,
            type,
            title,
            body,
            data,
            actionUrl,
        });

        const populated = await notification.populate('sender', 'name avatar');

        // Real-time emit via socket
        if (io) {
            io.to(`user_${recipientId}`).emit('new_notification', {
                ...populated.toObject(),
                config: NOTIF_CONFIG[type],
            });
        }

        return notification;
    } catch (error) {
        console.error('Notification create error:', error.message);
    }
};

module.exports = { createNotification, setSocketIO, NOTIF_CONFIG };