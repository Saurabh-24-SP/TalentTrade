import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GlassCard, PageShell, PremiumButton, Reveal } from "../components/PremiumMotion";

export default function Register() {
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "user", skills: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
            await register({ ...form, skills });
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell>
            <div className="flex min-h-screen items-center justify-center px-4 py-10">
                <Reveal className="w-full max-w-md">
                    <GlassCard className="p-8 md:p-10">

                        <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-2xl text-white shadow-lg shadow-indigo-500/25">🎉</div>
                            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900">Join TalentTrade</h2>
                            <p className="mt-2 text-sm text-slate-500">Get 10 free credits on signup.</p>
                        </div>

                        {error && (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
                                <input type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="premium-input" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                                <input type="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="premium-input" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                                <input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="premium-input" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">I want to</label>
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="premium-select">
                                    <option value="user">Request services (User)</option>
                                    <option value="provider">Offer services (Provider)</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">
                                    My skills <span className="font-normal text-slate-400">(comma separated)</span>
                                </label>
                                <input type="text" placeholder="e.g. Coding, Teaching, Cooking" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="premium-input" />
                            </div>

                            <PremiumButton type="submit" disabled={loading} className="w-full py-3">
                                {loading ? "Creating account..." : "Create account"}
                            </PremiumButton>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            Already have an account?{" "}
                            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                                Login
                            </Link>
                        </p>
                    </GlassCard>
                </Reveal>
            </div>
        </PageShell>
    );
}