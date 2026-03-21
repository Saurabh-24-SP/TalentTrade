import { useState, useEffect } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function CreditDashboard() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/transactions/my")
            .then((res) => setTransactions(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Calculate stats
    const earned = transactions
        .filter((t) => t.provider?._id === user?._id && t.status === "completed")
        .reduce((sum, t) => sum + t.hoursSpent, 0);

    const spent = transactions
        .filter((t) => t.requester?._id === user?._id && t.status === "completed")
        .reduce((sum, t) => sum + t.hoursSpent, 0);

    const pending = transactions.filter((t) => t.status === "pending").length;

    const stats = [
        { label: "Current Balance", value: user?.timeCredits, icon: "⏱", color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Total Earned", value: earned, icon: "📈", color: "text-green-600", bg: "bg-green-50" },
        { label: "Total Spent", value: spent, icon: "📉", color: "text-red-500", bg: "bg-red-50" },
        { label: "Pending", value: pending, icon: "⏳", color: "text-yellow-600", bg: "bg-yellow-50" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">⏱ Credit Dashboard</h1>
                    <p className="text-gray-500">Track your Time Credits and transaction history</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {stats.map(({ label, value, icon, color, bg }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                            <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block ${bg} ${color}`}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Credit Level</span>
                        <span className="text-sm font-bold text-indigo-600">{user?.timeCredits} credits</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((user?.timeCredits / 100) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {user?.timeCredits >= 100
                            ? "🏆 Expert level!"
                            : `${100 - (user?.timeCredits || 0)} credits to reach Expert level`
                        }
                    </p>
                </div>

                {/* Transaction History */}
                <h2 className="text-lg font-bold text-gray-800 mb-4">Transaction History</h2>

                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        No transactions yet. Start exchanging services!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => {
                            const isProvider = t.provider?._id === user?._id;
                            const statusColor = {
                                completed: "text-green-600",
                                pending: "text-yellow-600",
                                accepted: "text-blue-600",
                                cancelled: "text-red-500",
                                disputed: "text-purple-600",
                            };

                            return (
                                <div key={t._id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{t.service?.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {isProvider ? `From: ${t.requester?.name}` : `To: ${t.provider?.name}`}
                                            {" · "}
                                            {new Date(t.createdAt).toLocaleDateString("en-IN")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-base ${isProvider ? "text-green-600" : "text-red-500"}`}>
                                            {isProvider ? "+" : "-"}{t.hoursSpent}h
                                        </p>
                                        <p className={`text-xs font-semibold capitalize ${statusColor[t.status]}`}>
                                            {t.status}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}