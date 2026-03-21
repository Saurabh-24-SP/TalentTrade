import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

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
            setServices(services.filter((s) => s._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            await API.put(`/services/update/${id}`, { status: newStatus });
            setServices(services.map((s) =>
                s._id === id ? { ...s, status: newStatus } : s
            ));
        } catch (err) {
            alert(err.response?.data?.message || "Update failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">My Services</h1>
                        <p className="text-gray-500">Manage your listed services</p>
                    </div>
                    <Link
                        to="/post-service"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                        + Post New Service
                    </Link>
                </div>

                {/* Services List */}
                {loading ? (
                    <LoadingSpinner text="Loading your services..." />
                ) : services.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">No services yet</h3>
                        <p className="text-gray-400 text-sm mb-5">Post your first service and start earning credits!</p>
                        <Link
                            to="/post-service"
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                            Post a Service
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {services.map((s) => (
                            <div key={s._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800">{s.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize
                        ${s.status === "active"
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                {s.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-2 line-clamp-1">{s.description}</p>
                                        <div className="flex gap-3 text-xs text-gray-400">
                                            <span className="capitalize">📁 {s.category}</span>
                                            <span>⏱ {s.hoursRequired}h</span>
                                            <span>📦 {s.totalBookings} bookings</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => toggleStatus(s._id, s.status)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                        ${s.status === "active"
                                                    ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                                }`}
                                        >
                                            {s.status === "active" ? "Deactivate" : "Activate"}
                                        </button>
                                        <Link
                                            to={`/services/${s._id}`}
                                            className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(s._id)}
                                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                                        >
                                            Delete
                                        </button>
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