import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";

const features = [
    { icon: "⏱", title: "Time Credits", desc: "Earn credits by offering services. Spend them to get help." },
    { icon: "🤖", title: "AI Matching", desc: "Our AI finds the best service providers for your needs." },
    { icon: "🛡️", title: "Fraud Protection", desc: "AI monitors every transaction to keep you safe." },
    { icon: "💬", title: "Real-time Chat", desc: "Chat directly with service providers instantly." },
];

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!target) return;
        let start = 0;
        const duration = 1500;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target]);

    return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        users: 0,
        services: 0,
        hoursExchanged: 0,
        avgRating: 0,
    });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Parallel mein sab fetch karo
                const [usersRes, servicesRes, transactionsRes] = await Promise.allSettled([
                    API.get('/auth/stats').catch(() => null),
                    API.get('/services/stats').catch(() => null),
                    API.get('/transactions/stats').catch(() => null),
                ]);

                // Fallback — agar dedicated stats route nahi hai toh
                const [usersData, servicesData, transData] = await Promise.allSettled([
                    API.get('/admin/stats').catch(() => null),
                ]);

                const adminStats = usersData?.value?.data;

                if (adminStats) {
                    setStats({
                        users: adminStats.totalUsers || 0,
                        services: adminStats.totalServices || 0,
                        hoursExchanged: adminStats.totalTransactions || 0,
                        avgRating: adminStats.avgRating || 0,
                    });
                } else {
                    // Individual endpoints try karo
                    try {
                        const [u, s, t] = await Promise.all([
                            API.get('/admin/users').catch(() => ({ data: [] })),
                            API.get('/services').catch(() => ({ data: [] })),
                            API.get('/admin/transactions').catch(() => ({ data: [] })),
                        ]);

                        const users = Array.isArray(u.data) ? u.data.length : (u.data?.users?.length || 0);
                        const services = Array.isArray(s.data) ? s.data.length : (s.data?.services?.length || 0);
                        const transactions = Array.isArray(t.data) ? t.data.length : (t.data?.transactions?.length || 0);

                        setStats({
                            users,
                            services,
                            hoursExchanged: transactions,
                            avgRating: 4.9,
                        });
                    } catch (e) {
                        console.error('Stats fetch failed:', e);
                    }
                }
            } catch (error) {
                console.error('Stats error:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-indigo-600 text-white py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <span className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        🤖 Powered by Groq AI
                    </span>
                    <h1 className="text-5xl font-extrabold mt-4 mb-4 leading-tight">
                        Exchange Skills,<br />Not Money
                    </h1>
                    <p className="text-indigo-200 text-lg mb-8">
                        Trade your time and skills instead of money.
                        Help someone, earn credits, get help back.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        {user ? (
                            <Link to="/services" className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
                                Browse Services →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
                                    Get Started Free
                                </Link>
                                <Link to="/services" className="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-500 transition">
                                    Browse Services
                                </Link>
                            </>
                        )}
                    </div>
                    <p className="text-indigo-300 text-sm mt-4">
                        🎁 New users get 10 free Time Credits!
                    </p>
                </div>
            </section>

            {/* ✅ Real-time Stats */}
            <section className="bg-white py-8 border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {statsLoading ? (
                        // Loading skeleton
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-100 rounded w-24 mx-auto"></div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div>
                                <div className="text-2xl font-extrabold text-indigo-600">
                                    <AnimatedCounter target={stats.users} suffix="+" />
                                </div>
                                <div className="text-sm text-gray-500">Active Users</div>
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-indigo-600">
                                    <AnimatedCounter target={stats.services} suffix="+" />
                                </div>
                                <div className="text-sm text-gray-500">Services Listed</div>
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-indigo-600">
                                    <AnimatedCounter target={stats.hoursExchanged} suffix="+" />
                                </div>
                                <div className="text-sm text-gray-500">Hours Exchanged</div>
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-indigo-600">
                                    {stats.avgRating > 0
                                        ? `${parseFloat(stats.avgRating).toFixed(1)}★`
                                        : '4.9★'
                                    }
                                </div>
                                <div className="text-sm text-gray-500">Avg. Rating</div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
                        Why TalentTrade?
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {features.map(({ icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
                                <div className="text-3xl mb-3">{icon}</div>
                                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                                <p className="text-gray-500 text-sm">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            {!user && (
                <section className="bg-indigo-600 text-white py-16 px-4 text-center">
                    <h2 className="text-3xl font-bold mb-3">Ready to Join?</h2>
                    <p className="text-indigo-200 mb-6">Start exchanging skills today. It is completely free!</p>
                    <Link to="/register" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-indigo-50 transition">
                        Create Free Account →
                    </Link>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
                © 2025 TalentTrade AI — Built with ❤️ by Saurabh
            </footer>
        </div>
    );
}