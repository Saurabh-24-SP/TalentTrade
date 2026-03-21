const express = require("express");
const { sendEmail } = require("../services/emailService");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// JWT Token banao
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, skills } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, password required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "user",
            skills: skills || [],
        });

        const token = generateToken(user._id.toString());
        
        sendEmail(user.email, 'welcome', { name: user.name }).catch(err => {
            console.error('Welcome email failed:', err.message);
        });

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            timeCredits: user.timeCredits,
            skills: user.skills,
            avatar: user.avatar || "",
            token: token,
        });

    } catch (error) {
        console.error("Register Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id.toString());

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            timeCredits: user.timeCredits,
            skills: user.skills,
            avatar: user.avatar || "",
            token: token,
        });

    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ GET MY PROFILE
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -avatarPublicId");
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// ✅ UPDATE PROFILE
router.put("/update-profile", protect, async (req, res) => {
    try {
        const { name, bio, skills, location, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, bio, skills, location, avatar },
            { new: true }
        ).select("-password");
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;