import { useState, useEffect } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";

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
        ]).then(([s, u, d]) => {
            setStats(s.data);
            setUsers(u.data);
            setDisputes(d.data);
        }).catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const verifyUser = async (id) => {
        await API.put(`/admin/verify/${id}`);
        setUsers(users.map((u) => u._id === id ? { ...u, isVerified: true } : u));
    };

    const banUser = async (id) => {
        if (!window.confirm("Are you sure you want to ban this user?")) return;
        await API.put(`/admin/ban/${id}`);
        setUsers(users.map((u) => u._id === id ? { ...u, isBanned: true } : u));
    };

    const resolveDispute = async (id) => {
        const note = prompt("Enter resolution note:");
        if (!note) return;
        await API.put(`/disputes/resolve/${id}`, { adminNote: note });
        setDisputes(disputes.map((d) =>
            d._id === id ? { ...d, status: "resolved", adminNote: note } : d
        ));
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex justify-center items-center h-64 text-gray-400">Loading...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">🛠️ Admin Dashboard</h1>
                    <p className="text-gray-500">Manage users, disputes, and platform stats</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Total Services", value: stats.totalServices, icon: "📋", color: "text-green-600", bg: "bg-green-50" },
                        { label: "Total Transactions", value: stats.totalTransactions, icon: "⏱", color: "text-yellow-600", bg: "bg-yellow-50" },
                        { label: "Open Disputes", value: stats.openDisputes, icon: "⚠️", color: "text-red-500", bg: "bg-red-50" },
                    ].map(({ label, value, icon, color, bg }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className={`text-3xl font-extrabold ${color}`}>{value ?? 0}</div>
                            <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${bg} ${color}`}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-gray-200">
                    {["overview", "users", "disputes"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-5 py-2.5 text-sm font-semibold capitalize transition border-b-2 -mb-px
                ${tab === t
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {t === "users" ? `Users (${users.length})` : ""}
                            {t === "disputes" ? `Disputes (${disputes.filter(d => d.status === "open").length})` : ""}
                            {t === "overview" ? "Overview" : ""}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {tab === "overview" && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center text-gray-400">
                        Select Users or Disputes tab to manage platform.
                    </div>
                )}

                {/* Users Tab */}
                {tab === "users" && (
                    <div className="space-y-3">
                        {users.map((u) => (
                            <div key={u._id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{u.name}</span>
                                        {u.isVerified && (
                                            <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                                                ✓ Verified
                                            </span>
                                        )}
                                        {u.isBanned && (
                                            <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                                                Banned
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        {u.email} · {u.role} · {u.timeCredits} credits
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {!u.isVerified && !u.isBanned && (
                                        <button
                                            onClick={() => verifyUser(u._id)}
                                            className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                                        >
                                            Verify
                                        </button>
                                    )}
                                    {!u.isBanned && u.role !== "admin" && (
                                        <button
                                            onClick={() => banUser(u._id)}
                                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                                        >
                                            Ban
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Disputes Tab */}
                {tab === "disputes" && (
                    <div className="space-y-3">
                        {disputes.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No disputes found.</div>
                        ) : disputes.map((d) => (
                            <div key={d._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800 mb-1">
                                            {d.raisedBy?.name} vs {d.againstUser?.name}
                                        </p>
                                        <p className="text-sm text-gray-500">{d.reason}</p>
                                        {d.adminNote && (
                                            <p className="text-sm text-green-600 mt-1">✓ {d.adminNote}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize
                      ${d.status === "open"
                                                ? "bg-yellow-50 text-yellow-600"
                                                : "bg-green-50 text-green-600"
                                            }`}>
                                            {d.status}
                                        </span>
                                        {d.status === "open" && (
                                            <button
                                                onClick={() => resolveDispute(d._id)}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}