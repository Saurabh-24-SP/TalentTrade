
const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },
        hoursSpent: { type: Number, required: true },
        message: { type: String, default: "" },
        status: {
            type: String,
            enum: ["pending", "accepted", "completed", "cancelled", "disputed"],
            default: "pending",
        },
        completedAt: { type: Date },
        isFlagged: { type: Boolean, default: false },
        fraudReason: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);