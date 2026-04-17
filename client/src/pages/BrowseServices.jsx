import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { GlassCard, LoadingGrid, PageShell, Reveal, SectionHeading, Stagger, StaggerItem } from "../components/PremiumMotion";

const CATEGORIES = ["all", "education", "tech", "health", "home", "creative", "transport", "other"];

const categoryColors = {
    education: "bg-blue-50 text-blue-600",
    tech: "bg-purple-50 text-purple-600",
    health: "bg-emerald-50 text-emerald-600",
    home: "bg-amber-50 text-amber-600",
    creative: "bg-pink-50 text-pink-600",
    transport: "bg-orange-50 text-orange-600",
    other: "bg-slate-50 text-slate-600",
};

export default function BrowseServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchServices();
    }, [search, category, page]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 9 };
            if (search) params.search = search;
            if (category !== "all") params.category = category;

            const res = await API.get("/services/all", { params });
            setServices(res.data.services);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell>
            <Navbar />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Reveal>
                    <GlassCard className="mb-8 p-6 md:p-8">
                        <SectionHeading
                            eyebrow="Marketplace"
                            title="Browse services"
                            description="Find premium, trustworthy skills with intelligent filtering and elegant browsing."
                        />

                        <div className="mt-6 flex gap-3">
                            <input
                                type="text"
                                placeholder="Search services..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="premium-input flex-1"
                            />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {CATEGORIES.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => {
                                        setCategory(item);
                                        setPage(1);
                                    }}
                                    className={`premium-chip capitalize ${category === item ? "border-indigo-200 bg-indigo-600 text-white shadow-glow hover:text-white" : ""}`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                </Reveal>

                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">{total} services found</p>
                </div>

                {loading ? (
                    <LoadingGrid count={6} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
                ) : services.length === 0 ? (
                    <GlassCard className="py-16 text-center text-slate-500">No services found.</GlassCard>
                ) : (
                    <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <StaggerItem key={service._id}>
                                <ServiceCard service={service} />
                            </StaggerItem>
                        ))}
                    </Stagger>
                )}

                {total > 9 && (
                    <div className="mt-10 flex items-center justify-center gap-3">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="premium-button premium-button-ghost px-4 py-2 text-sm"
                        >
                            ← Prev
                        </button>
                        <span className="text-sm font-medium text-slate-500">Page {page}</span>
                        <button
                            disabled={page * 9 >= total}
                            onClick={() => setPage(page + 1)}
                            className="premium-button premium-button-ghost px-4 py-2 text-sm"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </PageShell>
    );
}

function ServiceCard({ service }) {
    return (
        <Link to={`/services/${service._id}`} className="block h-full">
            <GlassCard className="group h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide ${categoryColors[service.category] || "bg-slate-50 text-slate-600"}`}>
                    {service.category}
                </div>

                <div className="p-5">
                    <h3 className="mb-2 text-lg font-bold text-slate-900">{service.title}</h3>
                    <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-500">{service.description}</p>

                    {service.tags?.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {service.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="premium-chip">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
                                {service.provider?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700">{service.provider?.name}</p>
                                <p className="text-xs text-slate-400">⭐ {service.provider?.rating || "New"}</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-600">⏱ {service.hoursRequired}h</span>
                    </div>
                </div>
            </GlassCard>
        </Link>
    );
}