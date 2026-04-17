import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { GlassCard, PageShell, PremiumButton, Reveal, SectionHeading } from "../components/PremiumMotion";

export default function Profile() {
    const { user, setUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || "",
        bio: user?.bio || "",
        skills: user?.skills?.join(", ") || "",
    });
    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");
    const fileInputRef = useRef(null);

    // Update preview when user.avatar updates
    useEffect(() => {
        if (user?.avatar) {
            setAvatarPreview(user.avatar);
        }
    }, [user?.avatar]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Turant preview dikhao
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);

        setAvatarLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const res = await API.post("/upload/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                setAvatarPreview(res.data.avatar);
                setUser((prev) => ({ ...prev, avatar: res.data.avatar }));
                setSuccess("Profile picture update ho gayi! ✅");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Avatar upload failed");
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
            await API.put("/auth/update-profile", { ...form, skills });
            setSuccess("Profile updated successfully! ✅");
        } catch (err) {
            setError(err.response?.data?.message || "Update failed");
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
                            eyebrow="Account"
                            title="My profile"
                            description="Update your personal details and keep your profile presentation polished."
                        />
                    </div>
                </Reveal>

                <Reveal delay={0.05}>
                    <GlassCard className="p-8">
                    {/* Avatar Section */}
                    <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center">
                        <div className="relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-100 transition duration-300 hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-3xl font-bold text-white ring-4 ring-indigo-100 transition duration-300 hover:scale-105">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            {avatarLoading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25 transition hover:scale-105"
                            >
                                📷
                            </button>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-600">
                                    {user?.role}
                                </span>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                    ⏱ {user?.timeCredits} Credits
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarLoading}
                                className="mt-3 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:opacity-50"
                            >
                                {avatarLoading ? "Uploading..." : "📷 Change Profile Photo"}
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>

                    {success && (
                        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="premium-input"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Bio</label>
                            <textarea
                                placeholder="Tell others about yourself..."
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                rows={3}
                                className="premium-textarea"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">
                                Skills <span className="font-normal text-slate-400">(comma separated)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Coding, Teaching, Cooking"
                                value={form.skills}
                                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                className="premium-input"
                            />
                        </div>
                        <PremiumButton
                            type="submit"
                            disabled={loading}
                            className="w-full py-3"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </PremiumButton>
                    </form>
                </GlassCard>
                </Reveal>
            </div>
        </PageShell>
    );
}