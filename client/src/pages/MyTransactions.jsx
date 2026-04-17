import { useState, useEffect } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

const statusColors = {
    pending: "bg-amber-50 text-amber-600",
    accepted: "bg-sky-50 text-sky-600",
    completed: "bg-emerald-50 text-emerald-600",
    cancelled: "bg-rose-50 text-rose-600",
    disputed: "bg-violet-50 text-violet-600",
};

export default function MyTransactions() {
    const { user, refreshUser } = useAuth();
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
            setTransactions((prev) => prev.map((transaction) => (transaction._id === id ? { ...transaction, status: "accepted" } : transaction)));
            await refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to accept");
        }
    };

    const handleComplete = async (id) => {
        try {
            await API.put(`/transactions/complete/${id}`);
            setTransactions((prev) => prev.map((transaction) => (transaction._id === id ? { ...transaction, status: "completed" } : transaction)));
            await refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to complete");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel?")) return;
        try {
            await API.put(`/transactions/cancel/${id}`);
            setTransactions((prev) => prev.map((transaction) => (transaction._id === id ? { ...transaction, status: "cancelled" } : transaction)));
            await refreshUser();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel");
        }
    };

    const filtered = filter === "all" ? transactions : transactions.filter((transaction) => transaction.status === filter);

    return (
        <PageShell>
            <Navbar />
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <Reveal>
                    <div className="mb-6">
                        <SectionHeading
                            eyebrow="Workflow"
                            title="My transactions"
                            description="Manage all your service requests from a polished, easy-to-scan dashboard."
                        />
                    </div>
                </Reveal>

                <div className="mb-6 flex flex-wrap gap-2">
                    {["all", "pending", "accepted", "completed", "cancelled"].map((item) => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`premium-chip capitalize ${filter === item ? "border-indigo-200 bg-indigo-600 text-white shadow-glow hover:text-white" : ""}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-16 text-center text-slate-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <GlassCard className="py-16 text-center text-slate-500">No transactions found.</GlassCard>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((transaction) => {
                            const isProvider = transaction.provider?._id === user?._id;
                            const isRequester = transaction.requester?._id === user?._id;

                            return (
                                <GlassCard key={transaction._id} className="p-5">
                                    <div className="mb-3 flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">{transaction.service?.title}</h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {isProvider ? `Requested by: ${transaction.requester?.name}` : `Provider: ${transaction.provider?.name}`}
                                            </p>
                                            {transaction.message && <p className="mt-1 text-sm italic text-slate-400">"{transaction.message}"</p>}
                                        </div>

                                        <div className="text-right">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[transaction.status]}`}>
                                                {transaction.status}
                                            </span>
                                            <p className={`mt-2 text-lg font-bold ${isProvider ? "text-emerald-600" : "text-rose-500"}`}>
                                                {isProvider ? "+" : "-"}{transaction.hoursSpent}h
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mb-3 text-xs text-slate-400">
                                        {new Date(transaction.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {isProvider && transaction.status === "pending" && (
                                            <button onClick={() => handleAccept(transaction._id)} className="premium-button px-4 py-2 text-sm">
                                                Accept
                                            </button>
                                        )}
                                        {isProvider && transaction.status === "accepted" && (
                                            <button onClick={() => handleComplete(transaction._id)} className="premium-button px-4 py-2 text-sm">
                                                Mark complete ✅
                                            </button>
                                        )}
                                        {(isProvider || isRequester) && transaction.status === "pending" && (
                                            <button onClick={() => handleCancel(transaction._id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageShell>
    );
}