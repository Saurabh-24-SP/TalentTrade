import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

export default function MyServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get("/services/my/listings")
            .then((res) => setServices(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;
        try {
            await API.delete(`/services/delete/${id}`);
            setServices(services.filter((service) => service._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            await API.put(`/services/update/${id}`, { status: newStatus });
            setServices(services.map((service) => (service._id === id ? { ...service, status: newStatus } : service)));
        } catch (err) {
            alert(err.response?.data?.message || "Update failed");
        }
    };

    return (
        <PageShell>
            <Navbar />
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <Reveal>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <SectionHeading
                            eyebrow="Services"
                            title="My services"
                            description="Manage your listed services with a cleaner, more premium interface."
                        />
                        <Link to="/post-service" className="premium-button px-5 py-3 text-sm">
                            + Post new service
                        </Link>
                    </div>
                </Reveal>

                {loading ? (
                    <LoadingSpinner text="Loading your services..." />
                ) : services.length === 0 ? (
                    <GlassCard className="py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-2xl text-white shadow-lg shadow-indigo-500/25">📋</div>
                        <h3 className="text-lg font-bold text-slate-900">No services yet</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Post your first service and start earning credits.</p>
                        <Link to="/post-service" className="premium-button mt-6 px-6 py-3 text-sm">
                            Post a service
                        </Link>
                    </GlassCard>
                ) : (
                    <div className="space-y-4">
                        {services.map((service) => (
                            <GlassCard key={service._id} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900">{service.title}</h3>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${service.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                                {service.status}
                                            </span>
                                        </div>
                                        <p className="mb-2 line-clamp-1 text-sm text-slate-500">{service.description}</p>
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span className="capitalize">📁 {service.category}</span>
                                            <span>⏱ {service.hoursRequired}h</span>
                                            <span>📦 {service.totalBookings} bookings</span>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex gap-2">
                                        <button
                                            onClick={() => toggleStatus(service._id, service.status)}
                                            className={`rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${service.status === "active" ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                                        >
                                            {service.status === "active" ? "Deactivate" : "Activate"}
                                        </button>
                                        <Link
                                            to={`/services/${service._id}`}
                                            className="rounded-2xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(service._id)}
                                            className="rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                                        >
                                            Delete
                                        </button>
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