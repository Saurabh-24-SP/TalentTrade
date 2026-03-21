const mongoose = require("mongoose");

// Review Model
const reviewSchema = new mongoose.Schema({
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" },
}, { timestamps: true });

// Dispute Model
const disputeSchema = new mongoose.Schema({
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    againstUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    reason: { type: String },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    adminNote: { type: String, default: "" },
    resolvedAt: { type: Date },
}, { timestamps: true });

// Message Model
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
    Review: mongoose.model("Review", reviewSchema),
    Dispute: mongoose.model("Dispute", disputeSchema),
    Message: mongoose.model("Message", messageSchema),
};
