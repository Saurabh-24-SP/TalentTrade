const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        role: { type: String, enum: ["user", "provider", "admin"], default: "user" },
        timeCredits: { type: Number, default: 10 },
        skills: [{ type: String }],
        bio: { type: String, default: "" },
        avatar: { type: String, default: "" },
        location: {
            address: { type: String, default: "" },
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
        isVerified: { type: Boolean, default: false },
        isBanned: { type: Boolean, default: false },
        rating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        avatar: { type: String, default: '' },
        avatarPublicId: { type: String, default: '' },
    },

    { timestamps: true }
);

// ✅ Password hash — next() bilkul nahi use karo
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ✅ Password compare
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);