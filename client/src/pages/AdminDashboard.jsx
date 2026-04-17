import { useState, useEffect } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

export default function AdminDashboard() {
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [tab, setTab] = useState("overview");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            API.get("/admin/dashboard"),
            API.get("/admin/users"),
            API.get("/disputes/all"),
        ]).then(([statsResponse, usersResponse, disputesResponse]) => {
            setStats(statsResponse.data);
            setUsers(usersResponse.data);
            setDisputes(disputesResponse.data);
        }).catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const verifyUser = async (id) => {
        await API.put(`/admin/verify/${id}`);
        setUsers(users.map((user) => (user._id === id ? { ...user, isVerified: true } : user)));
    };

    const banUser = async (id) => {
        if (!window.confirm("Are you sure you want to ban this user?")) return;
        await API.put(`/admin/ban/${id}`);
        setUsers(users.map((user) => (user._id === id ? { ...user, isBanned: true } : user)));
    };

    const resolveDispute = async (id) => {
        const note = prompt("Enter resolution note:");
        if (!note) return;
        await API.put(`/disputes/resolve/${id}`, { adminNote: note });
        setDisputes(disputes.map((dispute) => (dispute._id === id ? { ...dispute, status: "resolved", adminNote: note } : dispute)));
    };

    if (loading) {
        return (
            <PageShell>
                <Navbar />
                <div className="flex h-64 items-center justify-center text-slate-400">Loading...</div>
            </PageShell>
        );
    }

    const cards = [
        { label: "Total users", value: stats.totalUsers, icon: "👥", color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Total services", value: stats.totalServices, icon: "📋", color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total transactions", value: stats.totalTransactions, icon: "⏱", color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Open disputes", value: stats.openDisputes, icon: "⚠️", color: "text-rose-500", bg: "bg-rose-50" },
    ];

    return (
        <PageShell>
            <Navbar />
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <Reveal>
                    <div className="mb-6">
                        <SectionHeading
                            eyebrow="Admin"
                            title="Admin dashboard"
                            description="Manage users, disputes, and platform metrics from a premium operations console."
                        />
                    </div>
                </Reveal>

                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {cards.map((card) => (
                        <GlassCard key={card.label} className="p-5 text-center">
                            <div className="mb-1 text-2xl">{card.icon}</div>
                            <div className={`text-3xl font-extrabold ${card.color}`}>{card.value ?? 0}</div>
                            <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${card.bg} ${card.color}`}>
                                {card.label}
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <div className="mb-6 flex gap-2 border-b border-slate-200">
                    {["overview", "users", "disputes"].map((item) => (
                        <button
                            key={item}
                            onClick={() => setTab(item)}
                            className={`border-b-2 px-5 py-3 text-sm font-semibold capitalize transition ${tab === item ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                        >
                            {item === "users" ? `Users (${users.length})` : item === "disputes" ? `Disputes (${disputes.filter((dispute) => dispute.status === "open").length})` : "Overview"}
                        </button>
                    ))}
                </div>

                {tab === "overview" && (
                    <GlassCard className="p-8 text-center text-slate-500">
                        Select the Users or Disputes tab to manage the platform.
                    </GlassCard>
                )}

                {tab === "users" && (
                    <div className="space-y-3">
                        {users.map((user) => (
                            <GlassCard key={user._id} className="flex items-center justify-between gap-4 px-5 py-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-slate-900">{user.name}</span>
                                        {user.isVerified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">Verified</span>}
                                        {user.isBanned && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">Banned</span>}
                                    </div>
                                    <p className="mt-0.5 text-sm text-slate-400">{user.email} · {user.role} · {user.timeCredits} credits</p>
                                </div>

                                <div className="flex gap-2">
                                    {!user.isVerified && !user.isBanned && (
                                        <button onClick={() => verifyUser(user._id)} className="rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100">Verify</button>
                                    )}
                                    {!user.isBanned && user.role !== "admin" && (
                                        <button onClick={() => banUser(user._id)} className="rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100">Ban</button>
                                    )}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {tab === "disputes" && (
                    <div className="space-y-3">
                        {disputes.length === 0 ? (
                            <GlassCard className="py-10 text-center text-slate-500">No disputes found.</GlassCard>
                        ) : disputes.map((dispute) => (
                            <GlassCard key={dispute._id} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="mb-1 font-bold text-slate-900">{dispute.raisedBy?.name} vs {dispute.againstUser?.name}</p>
                                        <p className="text-sm text-slate-500">{dispute.reason}</p>
                                        {dispute.adminNote && <p className="mt-1 text-sm text-emerald-600">✓ {dispute.adminNote}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${dispute.status === "open" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                                            {dispute.status}
                                        </span>
                                        {dispute.status === "open" && (
                                            <button onClick={() => resolveDispute(dispute._id)} className="premium-button px-3 py-1.5 text-xs">
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}