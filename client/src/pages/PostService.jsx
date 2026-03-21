import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";

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
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 py-10">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">Post a Service</h1>
                    <p className="text-gray-500">Offer your skills and earn time credits</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
                        >
                            {loading ? "Posting..." : "Post Service 🚀"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}