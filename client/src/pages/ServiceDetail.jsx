import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { GlassCard, PageShell, Reveal, SectionHeading, Stagger, StaggerItem } from "../components/PremiumMotion";

function StarRating({ value = 0 }) {
    return (
        <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className={index < Math.round(value) ? "text-amber-400" : "text-amber-200"}>★</span>
            ))}
        </div>
    );
}

function ReviewCard({ review }) {
    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 font-bold text-white shadow-lg shadow-indigo-500/25">
                    {review.reviewer?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-slate-900">{review.reviewer?.name || "Anonymous"}</p>
                        <span className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                    </div>
                    <div className="mt-1">
                        <StarRating value={review.rating} />
                    </div>
                    {review.comment && <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>}
                </div>
            </div>
        </div>
    );
}

function ServiceMiniCard({ service }) {
    return (
        <Link to={`/services/${service._id}`} className="block h-full">
            <div className="group h-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 via-sky-100 to-violet-100">
                    {service.images?.[0]?.url ? (
                        <img src={service.images[0].url} alt={service.title} className="h-full w-full object-cover" />
                    ) : service.image ? (
                        <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-indigo-500">🛠️</div>
                    )}
                </div>
                <div className="p-4">
                    <div className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                        {service.category}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900">{service.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{service.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 font-bold text-white">
                                {service.provider?.name?.[0]?.toUpperCase() || "P"}
                            </div>
                            <span>{service.provider?.name || "Provider"}</span>
                        </div>
                        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                            ⏱ {service.hoursRequired}h
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function SectionLabel({ title, value }) {
    return (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

export default function ServiceDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [selectedImage, setSelectedImage] = useState("");

    useEffect(() => {
        setLoading(true);
        API.get(`/services/${id}`)
            .then((res) => {
                setService(res.data);
                const firstImage = res.data.images?.[0]?.url || res.data.image || "";
                setSelectedImage(firstImage);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        API.get(`/services/${id}/reviews`)
            .then((res) => setReviews(res.data))
            .catch((err) => console.error(err));
    }, [id]);

    const ratingSummary = useMemo(() => {
        if (!reviews.length) return null;
        const avg = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        return avg.toFixed(1);
    }, [reviews]);

    useEffect(() => {
        if (!selectedImage && service) {
            const fallbackImage = service.images?.[0]?.url || service.image || "";
            setSelectedImage(fallbackImage);
        }
    }, [service, selectedImage]);

    const handleRequest = async () => {
        if (!user) return navigate("/login");
        if (!service || service.provider?._id === user._id) return;

        setRequesting(true);
        setError("");
        setSuccess("");
        try {
            await API.post(`/services/${id}/request`, { message });
            setSuccess("Service requested successfully. Provider ko notification bhej di gayi hai.");
            setMessage("");
        } catch (err) {
            setError(err.response?.data?.message || "Request failed");
        } finally {
            setRequesting(false);
        }
    };

    const handleSave = async () => {
        if (!user) return navigate("/login");
        if (!service || service.provider?._id === user._id) return;

        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await API.post(`/services/${id}/save`);
            setService((prev) => (prev ? { ...prev, isSaved: true } : prev));
            setSuccess("Service saved to your collection.");
        } catch (err) {
            setError(err.response?.data?.message || "Could not save service");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex h-80 items-center justify-center text-slate-400">Loading service details...</div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex h-80 items-center justify-center text-slate-400">Service not found.</div>
            </div>
        );
    }

    const isOwner = user?._id === service.provider?._id;
    const availability = service.availability || { mode: "flexible", days: [], hours: [], note: "" };
    const gallery = service.images?.filter((image) => image?.url) || [];
    const providerRating = service.provider?.rating || 0;
    const completedJobs = service.providerStats?.completedJobsCount || 0;
    const similarServices = service.similarServices || [];
    const mainImage = selectedImage || gallery[0]?.url || service.image || "";

    return (
        <PageShell>
            <Navbar />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <span className="premium-pill capitalize">{service.category}</span>
                        <span className="premium-pill">{service.providerStats?.reviewCount || reviews.length} reviews</span>
                        <span className="premium-pill">{completedJobs} completed jobs</span>
                    </div>
                </Reveal>

                <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="space-y-6">
                        <Reveal>
                            <GlassCard className="overflow-hidden p-0">
                                <div className="relative aspect-[16/9] bg-gradient-to-br from-indigo-100 via-sky-100 to-violet-100">
                                    {mainImage ? (
                                        <img src={mainImage} alt={service.title} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-6xl text-indigo-500">🧩</div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-6 py-5 text-white">
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Service details</p>
                                        <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{service.title}</h1>
                                    </div>
                                </div>

                                {gallery.length > 1 && (
                                    <div className="flex gap-3 overflow-x-auto border-t border-slate-100 bg-white p-4">
                                        {(gallery.length ? gallery : [{ url: mainImage }]).map((image, index) => (
                                            <button
                                                key={`${image.url}-${index}`}
                                                type="button"
                                                onClick={() => setSelectedImage(image.url)}
                                                className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition ${selectedImage === image.url ? "border-indigo-500 shadow-glow" : "border-transparent"}`}
                                            >
                                                <img src={image.url} alt={`${service.title} ${index + 1}`} className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </Reveal>

                        <Reveal delay={0.05}>
                            <GlassCard className="p-6 md:p-8">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Full description</p>
                                        <h2 className="mt-2 text-2xl font-bold text-slate-900">{service.title}</h2>
                                    </div>
                                    <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-right">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Credits required</p>
                                        <p className="mt-1 text-2xl font-black text-indigo-700">{service.hoursRequired}h</p>
                                    </div>
                                </div>

                                <p className="mt-5 text-sm leading-7 text-slate-600">{service.description}</p>

                                {service.tags?.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {service.tags.map((tag) => (
                                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </Reveal>

                        <Reveal delay={0.1}>
                            <GlassCard className="p-6 md:p-8">
                                <SectionHeading
                                    eyebrow="Provider"
                                    title="Provider details"
                                    description="Everything you need to judge trust, experience, and fit before booking."
                                />
                                <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-xl font-black text-white shadow-lg shadow-indigo-500/25">
                                            {service.provider?.name?.[0]?.toUpperCase() || "P"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-slate-900">{service.provider?.name}</h3>
                                                {service.provider?.location?.address && (
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                                        {service.provider.location.address}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                <StarRating value={providerRating} />
                                                <span>{providerRating ? providerRating.toFixed?.(1) || providerRating : "New"}</span>
                                                <span>· {service.provider?.totalReviews || 0} reviews</span>
                                                <span>· {completedJobs} completed jobs</span>
                                            </div>
                                            {service.provider?.bio && <p className="mt-4 text-sm leading-7 text-slate-600">{service.provider.bio}</p>}
                                        </div>
                                    </div>

                                    {service.provider?.skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 md:justify-end">
                                            {service.provider.skills.map((skill) => (
                                                <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </Reveal>

                        <Reveal delay={0.15}>
                            <GlassCard className="p-6 md:p-8">
                                <SectionHeading
                                    eyebrow="Availability"
                                    title="When the provider is available"
                                    description="A quick glance at timing and flexibility before you request the service."
                                />
                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <SectionLabel title="Mode" value={availability.mode || "Flexible"} />
                                    <SectionLabel title="Days" value={availability.days?.length ? availability.days.join(", ") : "On request"} />
                                    <SectionLabel title="Hours" value={availability.hours?.length ? availability.hours.join(", ") : "On request"} />
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-600">
                                    {availability.note || "Availability is flexible and can be confirmed after you send the request."}
                                </p>
                            </GlassCard>
                        </Reveal>

                        <Reveal delay={0.2}>
                            <GlassCard className="p-6 md:p-8">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <SectionHeading
                                        eyebrow="Reviews"
                                        title={`Reviews (${reviews.length})`}
                                        description="Real feedback from people who worked with this provider."
                                    />
                                    {ratingSummary && (
                                        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-right">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">Average rating</p>
                                            <p className="mt-1 text-2xl font-black text-amber-600">{ratingSummary}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 space-y-4">
                                    {reviews.length === 0 ? (
                                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                                            No reviews yet for this service.
                                        </div>
                                    ) : (
                                        reviews.map((review) => <ReviewCard key={review._id} review={review} />)
                                    )}
                                </div>
                            </GlassCard>
                        </Reveal>

                        {similarServices.length > 0 && (
                            <Reveal delay={0.25}>
                                <SectionHeading
                                    eyebrow="Explore"
                                    title="Similar services"
                                    description="Other services from the marketplace that match this category or skill set."
                                />
                                <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                    {similarServices.map((item) => (
                                        <StaggerItem key={item._id}>
                                            <ServiceMiniCard service={item} />
                                        </StaggerItem>
                                    ))}
                                </Stagger>
                            </Reveal>
                        )}
                    </div>

                    <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                        <Reveal>
                            <GlassCard className="p-6 md:p-7">
                                <div className="rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white shadow-[0_24px_70px_rgba(79,70,229,0.3)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Request now</p>
                                    <div className="mt-3 text-4xl font-black">{service.hoursRequired}h</div>
                                    <p className="mt-1 text-sm text-white/80">Time credits required</p>
                                </div>

                                {user && !isOwner && (
                                    <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-center">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Your balance</p>
                                        <p className="mt-1 text-lg font-black text-slate-900">⏱ {user.timeCredits} Credits</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {success}
                                    </div>
                                )}
                                {error && (
                                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-5 space-y-3">
                                    {!isOwner && user ? (
                                        <>
                                            <textarea
                                                placeholder="Message to provider (optional)"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                rows={4}
                                                className="premium-input min-h-[120px]"
                                            />
                                            <button
                                                onClick={handleRequest}
                                                disabled={requesting}
                                                className="premium-button w-full justify-center px-5 py-3 text-sm"
                                            >
                                                {requesting ? "Requesting..." : "Request Service"}
                                            </button>
                                            <button
                                                onClick={() => navigate("/chat", { state: { userId: service.provider?._id } })}
                                                className="premium-button premium-button-ghost w-full justify-center px-5 py-3 text-sm"
                                            >
                                                Chat with Provider
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving || service.isSaved}
                                                className="premium-button premium-button-ghost w-full justify-center px-5 py-3 text-sm"
                                            >
                                                {saving ? "Saving..." : service.isSaved ? "Saved Service" : "Save Service"}
                                            </button>
                                        </>
                                    ) : isOwner ? (
                                        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
                                            This is your service listing.
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => navigate("/login")}
                                                className="premium-button w-full justify-center px-5 py-3 text-sm"
                                            >
                                                Login to Request
                                            </button>
                                            <button
                                                onClick={() => navigate("/login")}
                                                className="premium-button premium-button-ghost w-full justify-center px-5 py-3 text-sm"
                                            >
                                                Login to Save
                                            </button>
                                        </>
                                    )}
                                </div>
                            </GlassCard>
                        </Reveal>

                        <Reveal delay={0.05}>
                            <GlassCard className="p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick facts</p>
                                <div className="mt-4 grid gap-3">
                                    <SectionLabel title="Category" value={service.category} />
                                    <SectionLabel title="Credits" value={`${service.hoursRequired} hours`} />
                                    <SectionLabel title="Reviews" value={reviews.length.toString()} />
                                    <SectionLabel title="Bookings" value={completedJobs.toString()} />
                                </div>
                            </GlassCard>
                        </Reveal>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
