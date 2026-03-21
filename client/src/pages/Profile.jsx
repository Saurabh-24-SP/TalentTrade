import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import Navbar from "../components/Navbar";

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

    // user.avatar update hone pe preview update karo
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">My Profile</h1>
                    <p className="text-gray-500">Update your personal information</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white text-3xl font-bold flex items-center justify-center border-4 border-indigo-100">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            {avatarLoading && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-indigo-700 transition shadow-md"
                            >
                                📷
                            </button>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
                            <p className="text-gray-500 text-sm">{user?.email}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-semibold capitalize">
                                    {user?.role}
                                </span>
                                <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                                    ⏱ {user?.timeCredits} Credits
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarLoading}
                                className="mt-2 text-xs text-indigo-600 hover:underline disabled:opacity-50"
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
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                            <textarea
                                placeholder="Tell others about yourself..."
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Skills <span className="text-gray-400 font-normal">(comma separated)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Coding, Teaching, Cooking"
                                value={form.skills}
                                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}