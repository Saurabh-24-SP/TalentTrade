import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../utils/api";
import {
    AnimatedCounter,
    AnimatedTypingText,
    GlassCard,
    PageShell,
    PremiumButton,
    Reveal,
    SectionHeading,
    Stagger,
    StaggerItem,
} from "../components/PremiumMotion";

const features = [
    { icon: "⏱", title: "Time Credits", desc: "Earn credits by offering services and spend them with confidence." },
    { icon: "🤖", title: "AI Matching", desc: "Smart recommendations surface the right people at the right time." },
    { icon: "🛡️", title: "Trust Layer", desc: "Ratings, moderation, and alerts keep every exchange safer." },
    { icon: "💬", title: "Instant Chat", desc: "Move from discovery to conversation without friction." },
];

function StatCard({ label, value, suffix = "", accent = "text-indigo-600" }) {
    return (
        <GlassCard className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <div className={`mt-3 text-3xl font-extrabold ${accent}`}>
                <AnimatedCounter end={value} suffix={suffix} />
            </div>
        </GlassCard>
    );
}

export default function Home() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ users: 0, services: 0, hoursExchanged: 0, avgRating: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const adminStatsRes = await API.get("/admin/stats").catch(() => null);
                const adminStats = adminStatsRes?.data;

                if (adminStats) {
                    setStats({
                        users: adminStats.totalUsers || 0,
                        services: adminStats.totalServices || 0,
                        hoursExchanged: adminStats.totalTransactions || 0,
                        avgRating: adminStats.avgRating || 4.9,
                    });
                } else {
                    const [usersRes, servicesRes, transactionsRes] = await Promise.all([
                        API.get("/admin/users").catch(() => ({ data: [] })),
                        API.get("/services/all").catch(() => ({ data: { services: [] } })),
                        API.get("/admin/transactions").catch(() => ({ data: [] })),
                    ]);

                    const users = Array.isArray(usersRes.data) ? usersRes.data.length : usersRes.data?.users?.length || 0;
                    const services = Array.isArray(servicesRes.data?.services)
                        ? servicesRes.data.services.length
                        : Array.isArray(servicesRes.data)
                            ? servicesRes.data.length
                            : 0;
                    const transactions = Array.isArray(transactionsRes.data)
                        ? transactionsRes.data.length
                        : transactionsRes.data?.transactions?.length || 0;

                    setStats({
                        users,
                        services,
                        hoursExchanged: transactions,
                        avgRating: 4.9,
                    });
                }
            } catch (error) {
                console.error("Stats error:", error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statsCards = [
        { label: "Active users", value: stats.users, suffix: "+" },
        { label: "Services listed", value: stats.services, suffix: "+" },
        { label: "Hours exchanged", value: stats.hoursExchanged, suffix: "+" },
        { label: "Average rating", value: Number(stats.avgRating || 4.9), suffix: "★", accent: "text-amber-500" },
    ];

    return (
        <PageShell>
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <Reveal>
                    <section className="hero-panel px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                        <div className="hero-glow hero-glow-one" />
                        <div className="hero-glow hero-glow-two" />
                        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div className="relative z-10 max-w-2xl">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="premium-pill">Powered by Groq AI</span>
                                    <span className="premium-pill">Trusted skill exchange</span>
                                </div>
                                <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-white md:text-6xl lg:text-7xl">
                                    <span className="text-gradient">Exchange Skills</span>,
                                    <br />
                                    not money.
                                </h1>
                                <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">
                                    Trade your time, grow your network, and unlock help from people with real expertise.
                                </p>
                                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/85">
                                    <span className="premium-pill">Learn faster</span>
                                    <span className="premium-pill">Earn credits</span>
                                    <span className="premium-pill">Connect with skilled people</span>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    {user ? (
                                        <>
                                            <Link to="/dashboard" className="premium-button px-6 py-3 text-sm">
                                                Open dashboard
                                            </Link>
                                            <Link to="/services" className="premium-button premium-button-ghost px-6 py-3 text-sm">
                                                Browse services
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/register" className="premium-button px-6 py-3 text-sm">
                                                Get started free
                                            </Link>
                                            <Link to="/services" className="premium-button premium-button-ghost px-6 py-3 text-sm">
                                                Browse services
                                            </Link>
                                        </>
                                    )}
                                </div>

                                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                    {[
                                        "4.9/5 average rating",
                                        "10 free credits on signup",
                                        "AI matched discovery",
                                    ].map((item) => (
                                        <div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-md">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <GlassCard className="overflow-hidden p-0">
                                    <div className="border-b border-slate-100 px-6 py-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Live preview</p>
                                        <h2 className="mt-2 text-2xl font-bold text-slate-900">TalentTrade dashboard</h2>
                                        <p className="mt-2 text-sm text-slate-500">A premium exchange experience designed for momentum.</p>
                                    </div>
                                    <div className="space-y-4 p-6">
                                        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-5 text-white shadow-glow">
                                            <p className="text-sm/6 text-white/75">Next recommendation</p>
                                            <div className="mt-2 text-2xl font-bold">
                                                <AnimatedTypingText
                                                    sequences={[
                                                        "Design a landing page.",
                                                        1800,
                                                        "Learn React in a week.",
                                                        1800,
                                                        "Book a mentor today.",
                                                        1800,
                                                    ]}
                                                    className="text-gradient text-2xl font-bold"
                                                />
                                            </div>
                                            <p className="mt-3 max-w-sm text-sm text-white/80">
                                                Premium AI recommendations surface the best fit, faster.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                ["Trust score", "98%"],
                                                ["Avg response", "< 5m"],
                                                ["Bookings", "1.2k"],
                                                ["Repeat rate", "74%"],
                                            ].map(([label, value]) => (
                                                <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                                                    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    </section>
                </Reveal>

                <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statsLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="skeleton-card shimmer h-32 rounded-3xl" />
                        ))
                    ) : (
                        statsCards.map((card) => <StatCard key={card.label} {...card} />)
                    )}
                </section>

                <Reveal delay={0.05}>
                    <section className="mt-16">
                        <SectionHeading
                            eyebrow="Why TalentTrade"
                            title="A startup-level experience for trading skills"
                            description="Every interaction is designed to feel polished, fast, and trustworthy - from discovery to booking to follow-up."
                        />
                        <Stagger className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {features.map((feature) => (
                                <StaggerItem key={feature.title}>
                                    <GlassCard className="group h-full p-6 transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-2xl text-white shadow-lg shadow-indigo-500/25 transition duration-300 group-hover:scale-105">
                                            {feature.icon}
                                        </div>
                                        <h3 className="mt-5 text-xl font-bold text-slate-900">{feature.title}</h3>
                                        <p className="mt-3 text-sm leading-6 text-slate-500">{feature.desc}</p>
                                    </GlassCard>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </section>
                </Reveal>

                {!user && (
                    <Reveal delay={0.08}>
                        <section className="mt-16 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/75 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10">
                            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                                <div>
                                    <p className="section-eyebrow">Get started</p>
                                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                                        Ready to join the premium skill exchange?
                                    </h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                                        Start exchanging skills today. New users receive 10 free credits, and the platform is built to make the first booking feel effortless.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link to="/register" className="premium-button px-6 py-3 text-sm">
                                        Create account
                                    </Link>
                                    <Link to="/services" className="premium-button premium-button-ghost px-6 py-3 text-sm">
                                        Explore services
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </Reveal>
                )}

                <footer className="mt-16 border-t border-slate-200/70 pt-6 text-center text-sm text-slate-500">
                    © 2025 TalentTrade AI - Built with precision and care.
                </footer>
            </main>
        </PageShell>
    );
}