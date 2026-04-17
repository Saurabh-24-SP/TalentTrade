import { useState, useEffect } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { AnimatedProgress, GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

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

    const earned = transactions
        .filter((transaction) => transaction.provider?._id === user?._id && transaction.status === "completed")
        .reduce((sum, transaction) => sum + transaction.hoursSpent, 0);

    const spent = transactions
        .filter((transaction) => transaction.requester?._id === user?._id && transaction.status === "completed")
        .reduce((sum, transaction) => sum + transaction.hoursSpent, 0);

    const pending = transactions.filter((transaction) => transaction.status === "pending").length;

    const stats = [
        { label: "Current balance", value: user?.timeCredits, icon: "⏱", color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Total earned", value: earned, icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total spent", value: spent, icon: "📉", color: "text-rose-500", bg: "bg-rose-50" },
        { label: "Pending", value: pending, icon: "⏳", color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <PageShell>
            <Navbar />

            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <Reveal>
                    <div className="mb-6">
                        <SectionHeading
                            eyebrow="Wallet"
                            title="Credit dashboard"
                            description="Track your time credits and transaction history in a refined, premium layout."
                        />
                    </div>
                </Reveal>

                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {stats.map(({ label, value, icon, color, bg }) => (
                        <GlassCard key={label} className="p-4 text-center">
                            <div className="mb-1 text-2xl">{icon}</div>
                            <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                            <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${color}`}>
                                {label}
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <GlassCard className="mb-6 p-5">
                    <div className="mb-2 flex justify-between">
                        <span className="text-sm font-semibold text-slate-700">Credit level</span>
                        <span className="text-sm font-bold text-indigo-600">{user?.timeCredits} credits</span>
                    </div>
                    <AnimatedProgress value={Math.min((user?.timeCredits / 100) * 100, 100)} />
                    <p className="mt-2 text-xs text-slate-400">
                        {user?.timeCredits >= 100
                            ? "🏆 Expert level!"
                            : `${100 - (user?.timeCredits || 0)} credits to reach Expert level`
                        }
                    </p>
                </GlassCard>

                <h2 className="mb-4 text-lg font-bold text-slate-900">Transaction history</h2>

                {loading ? (
                    <div className="py-10 text-center text-slate-400">Loading...</div>
                ) : transactions.length === 0 ? (
                    <GlassCard className="py-10 text-center text-slate-500">No transactions yet. Start exchanging services!</GlassCard>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => {
                            const isProvider = transaction.provider?._id === user?._id;
                            const statusColor = {
                                completed: "text-emerald-600",
                                pending: "text-amber-600",
                                accepted: "text-sky-600",
                                cancelled: "text-rose-500",
                                disputed: "text-violet-600",
                            };

                            return (
                                <GlassCard key={transaction._id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{transaction.service?.title}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {isProvider ? `From: ${transaction.requester?.name}` : `To: ${transaction.provider?.name}`}
                                            {" · "}
                                            {new Date(transaction.createdAt).toLocaleDateString("en-IN")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-base font-bold ${isProvider ? "text-emerald-600" : "text-rose-500"}`}>
                                            {isProvider ? "+" : "-"}{transaction.hoursSpent}h
                                        </p>
                                        <p className={`text-xs font-semibold capitalize ${statusColor[transaction.status]}`}>
                                            {transaction.status}
                                        </p>
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