import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { GlassCard, PageShell, PremiumButton, Reveal, SectionHeading } from "../components/PremiumMotion";

const CATEGORIES = ["education", "tech", "health", "home", "creative", "transport", "other"];

export default function PostService() {
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "education",
        hoursRequired: 1,
        tags: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
            await API.post("/services/create", { ...form, tags });
            navigate("/services");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell>
            <Navbar />

            <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
                <Reveal>
                    <div className="mb-8">
                        <SectionHeading
                            eyebrow="Create listing"
                            title="Post a service"
                            description="Offer your skills and earn time credits with a polished, premium listing experience."
                        />
                    </div>
                </Reveal>

                <Reveal delay={0.04}>
                    <GlassCard className="p-8">

                    {error && (
                        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Service Title
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. I will teach React JS"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                required
                                className="premium-input"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                placeholder="Describe your service in detail..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                required
                                rows={4}
                                className="premium-textarea"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="premium-select"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat} className="capitalize">
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Hours Required */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Hours Required <span className="text-gray-400 font-normal">(Time Credits)</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={form.hoursRequired}
                                onChange={(e) => setForm({ ...form, hoursRequired: Number(e.target.value) })}
                                required
                                className="premium-input"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. react, javascript, coding"
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                className="premium-input"
                            />
                        </div>

                        {/* Submit */}
                        <PremiumButton
                            type="submit"
                            disabled={loading}
                            className="w-full py-3"
                        >
                            {loading ? "Posting..." : "Post Service 🚀"}
                        </PremiumButton>

                    </form>
                </GlassCard>
                </Reveal>
            </div>
        </PageShell>
    );
}