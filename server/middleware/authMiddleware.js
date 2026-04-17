const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Login check — token verification
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Extract token
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user
            req.user = await User.findById(decoded.id).select("-password");

            return next();

        } catch (error) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

// Admin access only
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Access denied — Admins only" });
};

// Provider or Admin access
const providerOrAdmin = (req, res, next) => {
    if (
        req.user &&
        (req.user.role === "provider" || req.user.role === "admin")
    ) {
        return next();
    }
    return res.status(403).json({ message: "Access denied — Providers only" });
};

module.exports = { protect, adminOnly, providerOrAdmin };
