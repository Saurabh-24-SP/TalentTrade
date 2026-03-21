import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";

const CATEGORIES = ["all", "education", "tech", "health", "home", "creative", "transport", "other"];

const categoryColors = {
    education: "bg-blue-50 text-blue-600",
    tech: "bg-purple-50 text-purple-600",
    health: "bg-green-50 text-green-600",
    home: "bg-yellow-50 text-yellow-600",
    creative: "bg-pink-50 text-pink-600",
    transport: "bg-orange-50 text-orange-600",
    other: "bg-gray-50 text-gray-600",
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">Browse Services</h1>
                    <p className="text-gray-500">Find the perfect service for your needs</p>
                </div>

                {/* Search Bar */}
                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 flex-wrap mb-8">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategory(cat); setPage(1); }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition
                ${category === cat
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-400"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Total Count */}
                <p className="text-sm text-gray-500 mb-4">
                    {total} services found
                </p>

                {/* Services Grid */}
                {loading ? (
                    <div className="text-center py-16 text-gray-400">
                        Loading services...
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        No services found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <ServiceCard key={service._id} service={service} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {total > 9 && (
                    <div className="flex justify-center items-center gap-3 mt-10">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                            ← Prev
                        </button>
                        <span className="text-sm text-gray-600">Page {page}</span>
                        <button
                            disabled={page * 9 >= total}
                            onClick={() => setPage(page + 1)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Service Card Component
function ServiceCard({ service }) {
    return (
        <Link to={`/services/${service._id}`} className="no-underline">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">

                {/* Category Banner */}
                <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide ${categoryColors[service.category] || "bg-gray-50 text-gray-600"}`}>
                    {service.category}
                </div>

                <div className="p-4">
                    {/* Title */}
                    <h3 className="font-bold text-gray-800 text-base mb-2">{service.title}</h3>

                    {/* Description */}
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {service.description}
                    </p>

                    {/* Tags */}
                    {service.tags?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mb-4">
                            {service.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Provider + Credits */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                {service.provider?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700">{service.provider?.name}</p>
                                <p className="text-xs text-gray-400">⭐ {service.provider?.rating || "New"}</p>
                            </div>
                        </div>
                        <span className="bg-indigo-50 text-indigo-600 text-sm font-bold px-3 py-1 rounded-full">
                            ⏱ {service.hoursRequired}h
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}