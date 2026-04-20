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
        videoUrl: "",
        whatsappNumber: "",
        liveMeetingAvailable: false,
        liveMeetingPlatform: "",
        liveMeetingNote: "",
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [resourceFiles, setResourceFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const removeLocalFile = (listSetter, index) => {
        listSetter((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
            const payload = {
                title: form.title,
                description: form.description,
                category: form.category,
                hoursRequired: form.hoursRequired,
                tags,
                videoUrl: form.videoUrl,
                whatsappNumber: form.whatsappNumber,
                liveMeeting: {
                    available: form.liveMeetingAvailable,
                    platform: form.liveMeetingPlatform,
                    note: form.liveMeetingNote,
                },
            };

            const created = await API.post("/services/create", payload);
            const serviceId = created.data?._id;

            if (serviceId && imageFiles.length) {
                const fd = new FormData();
                imageFiles.forEach((file) => fd.append("images", file));
                await API.post(`/upload/service/${serviceId}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (serviceId && resourceFiles.length) {
                const fd = new FormData();
                resourceFiles.forEach((file) => fd.append("files", file));
                await API.post(`/upload/service/${serviceId}/content`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

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

                            {/* Video */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Video Link <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="e.g. https://youtube.com/watch?v=..."
                                    value={form.videoUrl}
                                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                                    className="premium-input"
                                />
                                <p className="mt-2 text-xs text-slate-500">Add a demo/intro video link for this service.</p>
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    WhatsApp Number <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="e.g. +91 98765 43210"
                                    value={form.whatsappNumber}
                                    onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                                    className="premium-input"
                                />
                                <p className="mt-2 text-xs text-slate-500">Buyers can contact you on WhatsApp from the service page.</p>
                            </div>

                            {/* Upload content */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Upload Content <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Images</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 5))}
                                            className="premium-input"
                                        />
                                        {!!imageFiles.length && (
                                            <div className="mt-2 space-y-2">
                                                {imageFiles.map((file, idx) => (
                                                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                        <p className="truncate text-xs font-semibold text-slate-700">{file.name}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLocalFile(setImageFiles, idx)}
                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">PDF / Recorded Video</p>
                                        <input
                                            type="file"
                                            accept="application/pdf,video/*"
                                            multiple
                                            onChange={(e) => setResourceFiles(Array.from(e.target.files || []).slice(0, 10))}
                                            className="premium-input"
                                        />
                                        {!!resourceFiles.length && (
                                            <div className="mt-2 space-y-2">
                                                {resourceFiles.map((file, idx) => (
                                                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                        <p className="truncate text-xs font-semibold text-slate-700">{file.name}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLocalFile(setResourceFiles, idx)}
                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        Files upload after you click <span className="font-semibold">Post Service</span>. Max: 5 images, 10 files.
                                    </p>
                                </div>
                            </div>

                            {/* Live meeting */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Live Meeting <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.liveMeetingAvailable}
                                            onChange={(e) => setForm({ ...form, liveMeetingAvailable: e.target.checked })}
                                            className="h-4 w-4"
                                        />
                                        I can do this service via live meeting
                                    </label>

                                    {form.liveMeetingAvailable && (
                                        <>
                                            <div>
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preferred platform</p>
                                                <select
                                                    value={form.liveMeetingPlatform}
                                                    onChange={(e) => setForm({ ...form, liveMeetingPlatform: e.target.value })}
                                                    className="premium-select"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Google Meet">Google Meet</option>
                                                    <option value="Zoom">Zoom</option>
                                                    <option value="Microsoft Teams">Microsoft Teams</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Instructions</p>
                                                <textarea
                                                    rows={3}
                                                    value={form.liveMeetingNote}
                                                    onChange={(e) => setForm({ ...form, liveMeetingNote: e.target.value })}
                                                    placeholder="Example: Meeting link will be shared after booking is accepted."
                                                    className="premium-textarea"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Meeting link + schedule are set per-booking when you accept a request.
                                            </p>
                                        </>
                                    )}
                                </div>
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