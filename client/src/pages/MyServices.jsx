import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

export default function MyServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeServiceId, setActiveServiceId] = useState(null);
    const [videoUrlDraft, setVideoUrlDraft] = useState("");
    const [whatsappDraft, setWhatsappDraft] = useState("");
    const [imageFiles, setImageFiles] = useState([]);
    const [resourceFiles, setResourceFiles] = useState([]);
    const [contentBusy, setContentBusy] = useState(false);
    const [contentError, setContentError] = useState("");

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

    const resetDraft = () => {
        setVideoUrlDraft("");
        setWhatsappDraft("");
        setImageFiles([]);
        setResourceFiles([]);
        setContentError("");
    };

    const toggleManager = (serviceId) => {
        setActiveServiceId((prev) => {
            const next = prev === serviceId ? null : serviceId;
            resetDraft();
            if (next) {
                const current = services.find((s) => s._id === next);
                setVideoUrlDraft(current?.videoUrl || "");
                setWhatsappDraft(current?.whatsappNumber || "");
            }
            return next;
        });
    };

    const saveVideoLink = async (serviceId, nextValue) => {
        setContentBusy(true);
        setContentError("");
        try {
            const payloadUrl = typeof nextValue === "string" ? nextValue : videoUrlDraft;
            const res = await API.put(`/services/update/${serviceId}`, { videoUrl: payloadUrl });
            const savedUrl = res.data?.videoUrl ?? payloadUrl;
            setServices((prev) => prev.map((s) => (s._id === serviceId ? { ...s, videoUrl: savedUrl } : s)));
            setVideoUrlDraft(savedUrl);
        } catch (err) {
            setContentError(err.response?.data?.message || "Failed to update video link");
        } finally {
            setContentBusy(false);
        }
    };

    const saveWhatsAppNumber = async (serviceId, nextValue) => {
        setContentBusy(true);
        setContentError("");
        try {
            const payloadNumber = typeof nextValue === "string" ? nextValue : whatsappDraft;
            const res = await API.put(`/services/update/${serviceId}`, { whatsappNumber: payloadNumber });
            const savedNumber = res.data?.whatsappNumber ?? payloadNumber;
            setServices((prev) => prev.map((s) => (s._id === serviceId ? { ...s, whatsappNumber: savedNumber } : s)));
            setWhatsappDraft(savedNumber);
        } catch (err) {
            setContentError(err.response?.data?.message || "Failed to update WhatsApp number");
        } finally {
            setContentBusy(false);
        }
    };

    const buildWhatsAppLink = (rawNumber = "") => {
        const digits = String(rawNumber || "").replace(/[^0-9]/g, "");
        if (!digits) return "";
        const text = encodeURIComponent("Hi! I'm interested in your TalentTrade service.");
        return `https://wa.me/${digits}?text=${text}`;
    };

    const uploadImages = async (serviceId) => {
        if (!imageFiles.length) return;
        setContentBusy(true);
        setContentError("");
        try {
            const fd = new FormData();
            imageFiles.forEach((file) => fd.append("images", file));
            const res = await API.post(`/upload/service/${serviceId}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setServices((prev) => prev.map((s) => (s._id === serviceId ? { ...s, images: res.data?.images || s.images } : s)));
            setImageFiles([]);
        } catch (err) {
            setContentError(err.response?.data?.message || "Image upload failed");
        } finally {
            setContentBusy(false);
        }
    };

    const uploadResources = async (serviceId) => {
        if (!resourceFiles.length) return;
        setContentBusy(true);
        setContentError("");
        try {
            const fd = new FormData();
            resourceFiles.forEach((file) => fd.append("files", file));
            const res = await API.post(`/upload/service/${serviceId}/content`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setServices((prev) => prev.map((s) => (s._id === serviceId ? { ...s, attachments: res.data?.attachments || s.attachments } : s)));
            setResourceFiles([]);
        } catch (err) {
            setContentError(err.response?.data?.message || "File upload failed");
        } finally {
            setContentBusy(false);
        }
    };

    const deleteServiceImage = async (serviceId, publicId) => {
        if (!publicId) return;
        setContentBusy(true);
        setContentError("");
        try {
            const res = await API.delete(`/upload/service/${serviceId}/image`, { data: { publicId } });
            setServices((prev) => prev.map((s) => (s._id === serviceId ? { ...s, images: res.data?.images || [] } : s)));
        } catch (err) {
            setContentError(err.response?.data?.message || "Delete failed");
        } finally {
            setContentBusy(false);
        }
    };

    const deleteServiceAttachment = async (serviceId, publicId) => {
        if (!publicId) return;
        setContentBusy(true);
        setContentError("");
        try {
            const res = await API.delete(`/upload/service/${serviceId}/content`, { data: { publicId } });
            setServices((prev) => prev.map((s) => (s._id === serviceId ? { ...s, attachments: res.data?.attachments || [] } : s)));
        } catch (err) {
            setContentError(err.response?.data?.message || "Delete failed");
        } finally {
            setContentBusy(false);
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

                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">🖼️ {(service.images || []).length}/5</span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">📎 {(service.attachments || []).length}/15</span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">🎥 {service.videoUrl ? "set" : "none"}</span>
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
                                            onClick={() => toggleManager(service._id)}
                                            className="rounded-2xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                                        >
                                            {activeServiceId === service._id ? "Close" : "Create Post"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service._id)}
                                            className="rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {activeServiceId === service._id && (
                                    <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl">
                                        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 px-5 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Content manager</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">Create post: add / edit / delete your media for this service</p>
                                        </div>

                                        <div className="p-5">
                                            {contentError && (
                                                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                    {contentError}
                                                </div>
                                            )}

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Links</p>

                                                    <div className="mt-4">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">WhatsApp</p>
                                                        <input
                                                            type="tel"
                                                            placeholder="e.g. +91 98765 43210"
                                                            value={whatsappDraft}
                                                            disabled={contentBusy}
                                                            onChange={(e) => setWhatsappDraft(e.target.value)}
                                                            className="premium-input mt-2"
                                                        />
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveWhatsAppNumber(service._id)}
                                                                disabled={contentBusy}
                                                                className="premium-button px-5 py-2.5 text-xs"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveWhatsAppNumber(service._id, "")}
                                                                disabled={contentBusy}
                                                                className="premium-button premium-button-ghost px-5 py-2.5 text-xs"
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">YouTube video</p>
                                                        <input
                                                            type="url"
                                                            placeholder="https://youtube.com/watch?v=..."
                                                            value={videoUrlDraft}
                                                            disabled={contentBusy}
                                                            onChange={(e) => setVideoUrlDraft(e.target.value)}
                                                            className="premium-input mt-2"
                                                        />
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveVideoLink(service._id)}
                                                                disabled={contentBusy}
                                                                className="premium-button px-5 py-2.5 text-xs"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => saveVideoLink(service._id, "")}
                                                                disabled={contentBusy}
                                                                className="premium-button premium-button-ghost px-5 py-2.5 text-xs"
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Upload</p>
                                                    <div className="mt-3 space-y-3">
                                                        <div>
                                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Images (max 5)</p>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                disabled={contentBusy || (service.images || []).length >= 5}
                                                                onChange={(e) => {
                                                                    const remaining = Math.max(0, 5 - (service.images || []).length);
                                                                    setImageFiles(Array.from(e.target.files || []).slice(0, remaining));
                                                                }}
                                                                className="premium-input mt-2"
                                                            />
                                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                                <p className="text-xs text-slate-500">Selected: <span className="font-semibold">{imageFiles.length}</span></p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => uploadImages(service._id)}
                                                                    disabled={contentBusy || !imageFiles.length}
                                                                    className="premium-button px-4 py-2 text-xs"
                                                                >
                                                                    Upload
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">PDF / Video</p>
                                                            <input
                                                                type="file"
                                                                accept="application/pdf,video/*"
                                                                multiple
                                                                disabled={contentBusy}
                                                                onChange={(e) => setResourceFiles(Array.from(e.target.files || []).slice(0, 10))}
                                                                className="premium-input mt-2"
                                                            />
                                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                                <p className="text-xs text-slate-500">Selected: <span className="font-semibold">{resourceFiles.length}</span></p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => uploadResources(service._id)}
                                                                    disabled={contentBusy || !resourceFiles.length}
                                                                    className="premium-button px-4 py-2 text-xs"
                                                                >
                                                                    Upload
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {(service.whatsappNumber || service.videoUrl) && (
                                                <div className="mt-6">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current links</p>
                                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                        {service.whatsappNumber && (
                                                            <div className="rounded-3xl border border-slate-200/70 bg-white px-4 py-3">
                                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">WhatsApp</p>
                                                                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{service.whatsappNumber}</p>
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    <a
                                                                        href={buildWhatsAppLink(service.whatsappNumber)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="premium-button premium-button-ghost inline-flex items-center justify-center px-4 py-2 text-xs"
                                                                    >
                                                                        Open
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => saveWhatsAppNumber(service._id, "")}
                                                                        disabled={contentBusy}
                                                                        className="premium-button premium-button-ghost px-4 py-2 text-xs text-rose-600"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {service.videoUrl && (
                                                            <div className="rounded-3xl border border-slate-200/70 bg-white px-4 py-3">
                                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">YouTube</p>
                                                                <p className="mt-1 truncate text-sm font-semibold text-slate-900">{service.videoUrl}</p>
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    <a
                                                                        href={service.videoUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="premium-button premium-button-ghost inline-flex items-center justify-center px-4 py-2 text-xs"
                                                                    >
                                                                        Open
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => saveVideoLink(service._id, "")}
                                                                        disabled={contentBusy}
                                                                        className="premium-button premium-button-ghost px-4 py-2 text-xs text-rose-600"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {Array.isArray(service.images) && service.images.length > 0 && (
                                                <div className="mt-6">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current images</p>
                                                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                        {service.images.map((img) => (
                                                            <div key={img.publicId || img.url} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                                                {img.url && <img src={img.url} alt="Service" className="h-24 w-full object-cover" />}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteServiceImage(service._id, img.publicId)}
                                                                    disabled={contentBusy}
                                                                    className="w-full px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {Array.isArray(service.attachments) && service.attachments.length > 0 && (
                                                <div className="mt-6 space-y-4">
                                                    {service.attachments.some((a) => a?.kind === "video") && (
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Videos</p>
                                                            <div className="mt-3 space-y-2">
                                                                {service.attachments.filter((a) => a?.kind === "video").map((item) => (
                                                                    <div key={item.publicId || item.url} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                                        <a
                                                                            href={item.url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 hover:text-indigo-700"
                                                                        >
                                                                            {item.originalName || item.url}
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteServiceAttachment(service._id, item.publicId)}
                                                                            disabled={contentBusy}
                                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {service.attachments.some((a) => a?.kind === "pdf") && (
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">PDFs</p>
                                                            <div className="mt-3 space-y-2">
                                                                {service.attachments.filter((a) => a?.kind === "pdf").map((item) => (
                                                                    <div key={item.publicId || item.url} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                                        <a
                                                                            href={item.url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 hover:text-indigo-700"
                                                                        >
                                                                            {item.originalName || item.url}
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteServiceAttachment(service._id, item.publicId)}
                                                                            disabled={contentBusy}
                                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {service.attachments.some((a) => !a?.kind || a?.kind === "file") && (
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Files</p>
                                                            <div className="mt-3 space-y-2">
                                                                {service.attachments.filter((a) => !a?.kind || a?.kind === "file").map((item) => (
                                                                    <div key={item.publicId || item.url} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                                                        <a
                                                                            href={item.url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 hover:text-indigo-700"
                                                                        >
                                                                            {item.originalName || item.url}
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteServiceAttachment(service._id, item.publicId)}
                                                                            disabled={contentBusy}
                                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}