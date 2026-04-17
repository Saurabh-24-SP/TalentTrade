const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: {
            type: String,
            enum: [
                'booking_request',
                'booking_accepted',
                'booking_declined',
                'booking_completed',
                'new_message',
                'meeting_invite',
                'credit_earned',
                'credit_deducted',
                'new_review',
                'service_approved',
                'fraud_alert',
                'system',
            ],
            required: true,
        },
        title: { type: String, required: true },
        body: { type: String, required: true },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        read: { type: Boolean, default: false },
        readAt: { type: Date },
        actionUrl: { type: String },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);