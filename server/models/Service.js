const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ["education", "tech", "health", "home", "creative", "transport", "other"],
            required: true,
        },
        hoursRequired: { type: Number, required: true, min: 1 },
        tags: [{ type: String }],
        location: {
            address: { type: String, default: "" },
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
        image: { type: String, default: "" },
        availability: {
            mode: { type: String, default: "flexible" },
            days: [{ type: String }],
            hours: [{ type: String }],
            note: { type: String, default: "" },
        },
        videoUrl: { type: String, default: "", trim: true },
        liveMeeting: {
            available: { type: Boolean, default: false },
            platform: { type: String, default: "", trim: true },
            note: { type: String, default: "", trim: true },
        },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        totalBookings: { type: Number, default: 0 },
        images: [{
            url: { type: String },
            publicId: { type: String },
        }],
        attachments: [{
            kind: { type: String, enum: ["video", "pdf", "file"], default: "file" },
            url: { type: String, default: "" },
            publicId: { type: String, default: "" },
            originalName: { type: String, default: "" },
            mimeType: { type: String, default: "" },
            sizeBytes: { type: Number, default: 0 },
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);