const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const Service = require("../models/Service");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { protect } = require("../middleware/authMiddleware");

// Initialize Groq Client
const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Helper function — Clean JSON response from AI
const cleanJSON = (text) => {
    return text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
};

// Helper function — Call Groq AI
const askAI = async (systemPrompt, userMessage) => {
    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
    });
    return response.choices[0].message.content;
};

// ✅ AI SERVICE RECOMMENDATION
// POST /api/ai/recommend
router.post("/recommend", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const allServices = await Service.find({ status: "active" })
            .populate("provider", "name rating")
            .limit(50);

        if (allServices.length === 0) {
            return res.json({ recommendations: [] });
        }

        const serviceList = allServices.map((s) => ({
            id: s._id,
            title: s.title,
            category: s.category,
            hours: s.hoursRequired,
            tags: s.tags,
        }));

        const result = await askAI(
            `You are a service recommendation engine for TalentTradeplatform.
       Users exchange services using time credits.
       IMPORTANT: Respond with ONLY raw JSON. No markdown. No backticks. No explanation.`,

            `User Profile:
       - Name: ${user.name}
       - Skills: ${user.skills?.join(", ") || "none"}
       - Time Credits: ${user.timeCredits}

       Available Services: ${JSON.stringify(serviceList)}

       Recommend top 3 services. Return ONLY this JSON:
       { "recommendations": [{ "id": "...", "title": "...", "reason": "..." }] }`
        );

        try {
            const parsed = JSON.parse(cleanJSON(result));
            return res.json(parsed);
        } catch (e) {
            console.error("Parse Error:", result);
            return res.json({ recommendations: [] });
        }

    } catch (error) {
        console.error("AI Recommend Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ AI SKILL MATCHING
// POST /api/ai/match
router.post("/match", protect, async (req, res) => {
    try {
        const { serviceId } = req.body;

        const service = await Service.findById(serviceId);
        const providers = await User.find({ isBanned: false })
            .select("name skills rating bio totalReviews");

        const result = await askAI(
            `You are a skill matching AI for TalentTradeplatform.
       IMPORTANT: Respond with ONLY raw JSON. No markdown. No backticks. No explanation.`,

            `Service needed: "${service.title}" (category: ${service.category})

       Available Providers: ${JSON.stringify(
                providers.map((p) => ({
                    id: p._id,
                    name: p.name,
                    skills: p.skills,
                    rating: p.rating,
                    reviews: p.totalReviews,
                }))
            )}

       Score each provider from 1-10.
       Return ONLY this JSON:
       { "matches": [{ "id": "...", "name": "...", "score": 8, "reason": "..." }] }
       Sort by score descending. Top 3 only.`
        );

        try {
            const parsed = JSON.parse(cleanJSON(result));
            return res.json(parsed);
        } catch (e) {
            console.error("Parse Error:", result);
            return res.json({ matches: [] });
        }

    } catch (error) {
        console.error("AI Match Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ AI FRAUD DETECTION
// POST /api/ai/fraud-check
router.post("/fraud-check", protect, async (req, res) => {
    try {
        const { transactionId } = req.body;

        const transaction = await Transaction.findById(transactionId)
            .populate("requester", "name timeCredits createdAt")
            .populate("provider", "name rating totalReviews")
            .populate("service", "title hoursRequired");

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const userHistory = await Transaction.find({
            $or: [
                { requester: transaction.requester._id },
                { provider: transaction.requester._id },
            ],
        }).limit(20);

        const result = await askAI(
            `You are a fraud detection AI for TalentTradeplatform.
       IMPORTANT: Respond with ONLY raw JSON. No markdown. No backticks. No explanation.`,

            `Transaction Details:
       - Service: ${transaction.service.title}
       - Hours: ${transaction.service.hoursRequired}
       - Requester Credits: ${transaction.requester.timeCredits}
       - Provider Rating: ${transaction.provider.rating}
       - Provider Reviews: ${transaction.provider.totalReviews}
       - Account Created: ${transaction.requester.createdAt}
       - Previous Transactions: ${userHistory.length}

       Is this transaction suspicious?
       Return ONLY this JSON:
       { "isFraud": false, "riskLevel": "low", "reason": "..." }`
        );

        try {
            const parsed = JSON.parse(cleanJSON(result));

            if (parsed.riskLevel === "high") {
                await Transaction.findByIdAndUpdate(transactionId, {
                    isFlagged: true,
                    fraudReason: parsed.reason,
                });
            }

            return res.json(parsed);
        } catch (e) {
            console.error("Parse Error:", result);
            return res.json({ isFraud: false, riskLevel: "low", reason: "Unable to analyze" });
        }

    } catch (error) {
        console.error("AI Fraud Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

// ✅ AI CHATBOT
// POST /api/ai/chat
router.post("/chat", protect, async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        const user = await User.findById(req.user._id);

        const messages = [
            {
                role: "system",
                content: `You are a friendly assistant for TalentTradeplatform.
                  TalentTradeis a platform where users exchange services using time credits.
                  Current User: ${user.name}, Credits: ${user.timeCredits}, Role: ${user.role}.
                  Help users with: posting services, earning credits, resolving issues.
                  Keep answers short — 2-3 sentences max.`
            },
            ...history,
            { role: "user", content: message },
        ];

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 500,
        });

        const reply = response.choices[0].message.content;

        return res.json({
            reply,
            history: [
                ...history,
                { role: "user", content: message },
                { role: "assistant", content: reply },
            ],
        });

    } catch (error) {
        console.error("AI Chat Error:", error.message);
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;