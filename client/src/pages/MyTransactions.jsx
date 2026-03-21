import { useState, useEffect } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const statusColors = {
    pending: "bg-yellow-50 text-yellow-600",
    accepted: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-600",
    cancelled: "bg-red-50 text-red-600",
    disputed: "bg-purple-50 text-purple-600",
};

export default function MyTransactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        API.get("/transactions/my")
            .then((res) => setTransactions(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleAccept = async (id) => {
        try {
            await API.put(`/transactions/accept/${id}`);
            setTransactions(transactions.map((t) =>
                t._id === id ? { ...t, status: "accepted" } : t
            ));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to accept");
        }
    };

    const handleComplete = async (id) => {
        try {
            await API.put(`/transactions/complete/${id}`);
            setTransactions(transactions.map((t) =>
                t._id === id ? { ...t, status: "completed" } : t
            ));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel?")) return;
        try {
            await API.put(`/transactions/cancel/${id}`);
            setTransactions(transactions.map((t) =>
                t._id === id ? { ...t, status: "cancelled" } : t
            ));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel");
        }
    };

    const filtered = filter === "all"
        ? transactions
        : transactions.filter((t) => t.status === filter);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">My Transactions</h1>
                    <p className="text-gray-500">Manage all your service requests</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {["all", "pending", "accepted", "completed", "cancelled"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition
                ${filter === s
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-400"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Transactions List */}
                {loading ? (
                    <div className="text-center py-16 text-gray-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        No transactions found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((t) => {
                            const isProvider = t.provider?._id === user?._id;
                            const isRequester = t.requester?._id === user?._id;

                            return (
                                <div key={t._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex justify-between items-start mb-3">

                                        {/* Service Info */}
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-base">
                                                {t.service?.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {isProvider
                                                    ? `Requested by: ${t.requester?.name}`
                                                    : `Provider: ${t.provider?.name}`
                                                }
                                            </p>
                                            {t.message && (
                                                <p className="text-sm text-gray-400 mt-1 italic">
                                                    "{t.message}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Status + Credits */}
                                        <div className="text-right">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[t.status]}`}>
                                                {t.status}
                                            </span>
                                            <p className={`text-lg font-bold mt-2 ${isProvider ? "text-green-600" : "text-red-500"}`}>
                                                {isProvider ? "+" : "-"}{t.hoursSpent}h
                                            </p>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <p className="text-xs text-gray-400 mb-3">
                                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric", month: "short", year: "numeric"
                                        })}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {/* Provider can accept pending */}
                                        {isProvider && t.status === "pending" && (
                                            <button
                                                onClick={() => handleAccept(t._id)}
                                                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                                            >
                                                Accept
                                            </button>
                                        )}

                                        {/* Provider can complete accepted */}
                                        {isProvider && t.status === "accepted" && (
                                            <button
                                                onClick={() => handleComplete(t._id)}
                                                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                                            >
                                                Mark Complete ✅
                                            </button>
                                        )}

                                        {/* Both can cancel pending */}
                                        {(isProvider || isRequester) && t.status === "pending" && (
                                            <button
                                                onClick={() => handleCancel(t._id)}
                                                className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
                                            >
                                                Cancel
                                            </button>
                                        )}
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