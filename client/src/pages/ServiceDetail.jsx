import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

// ─── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ value = 0, onChange, readonly = false, size = "md" }) {
    const [hover, setHover] = useState(0);
    const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
    const sz = sizes[size];
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

    return (
        <div className="flex flex-col gap-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onMouseEnter={() => !readonly && setHover(star)}
                        onMouseLeave={() => !readonly && setHover(0)}
                        onClick={() => !readonly && onChange?.(star)}
                        className={`transition-all ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                    >
                        <svg className={`${sz} ${star <= (hover || value) ? "text-amber-400" : "text-gray-300"}`}
                            fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                ))}
            </div>
            {!readonly && (hover || value) > 0 && (
                <span className="text-xs font-medium text-amber-600">{labels[hover || value]}</span>
            )}
        </div>
    );
}

// ─── Review Card Component ─────────────────────────────────────────────────────
function ReviewCard({ review }) {
    const timeAgo = (date) => {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return "abhi";
        if (s < 3600) return `${Math.floor(s / 60)}m pehle`;
        if (s < 86400) return `${Math.floor(s / 3600)}h pehle`;
        return `${Math.floor(s / 86400)}d pehle`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                    {review.reviewer?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 text-sm">{review.reviewer?.name}</span>
                        <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                    {review.comment && (
                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">{review.comment}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Rating Summary Component ──────────────────────────────────────────────────
function RatingSummary({ reviews }) {
    if (!reviews || reviews.length === 0) return null;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <div className="flex gap-6">
                <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-bold text-gray-900">{avg.toFixed(1)}</div>
                    <StarRating value={Math.round(avg)} readonly size="sm" />
                    <div className="text-xs text-gray-400 mt-1">{reviews.length} reviews</div>
                </div>
                <div className="flex-1 space-y-1.5">
                    {breakdown.map(({ star, count }) => {
                        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500 w-2">{star}</span>
                                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-gray-400 w-4 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Write Review Modal ────────────────────────────────────────────────────────
function WriteReviewModal({ service, onClose, onSuccess }) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setError("Please select a rating"); return; }
        if (comment.trim().length < 10) { setError("Review kam se kam 10 characters ka hona chahiye"); return; }
        setLoading(true);
        try {
            await API.post("/reviews/create", {
                revieweeId: service.provider._id,
                serviceId: service._id,
                rating,
                comment: comment.trim(),
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Review submit failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                    <h2 className="text-2xl font-bold">Rate Your Experience</h2>
                    <p className="text-amber-100 mt-1">{service?.title}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Rating *</label>
                        <StarRating value={rating} onChange={setRating} size="lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Review *
                            <span className="text-xs font-normal text-gray-400 ml-2">({comment.length}/500)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 500))}
                            rows={4}
                            placeholder="Apna experience share karo..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{error}</div>
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold hover:from-amber-500 hover:to-orange-600 transition disabled:opacity-50">
                            {loading ? "Submitting..." : "⭐ Submit Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main ServiceDetail Page ───────────────────────────────────────────────────
export default function ServiceDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [showReviewModal, setShowReviewModal] = useState(false);

    useEffect(() => {
        API.get(`/services/${id}`)
            .then((res) => setService(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (service?.provider?._id) {
            API.get(`/reviews/user/${service.provider._id}`)
                .then((res) => setReviews(res.data))
                .catch(console.error);
        }
    }, [service]);

    const handleBook = async () => {
        if (!user) return navigate("/login");
        setBooking(true);
        setError("");
        try {
            await API.post("/transactions/create", { serviceId: id, message });
            setSuccess("Service booked successfully! ✅");
            setMessage("");
        } catch (err) {
            setError(err.response?.data?.message || "Booking failed");
        } finally {
            setBooking(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex justify-center items-center h-64 text-gray-400">Loading...</div>
        </div>
    );

    if (!service) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex justify-center items-center h-64 text-gray-400">Service not found.</div>
        </div>
    );

    const isOwner = user?._id === service.provider?._id;
    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {showReviewModal && (
                <WriteReviewModal
                    service={service}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        API.get(`/reviews/user/${service.provider._id}`)
                            .then((res) => setReviews(res.data));
                    }}
                />
            )}

            <div className="max-w-4xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Left — Service Details */}
                    <div className="md:col-span-2 space-y-4">
                        <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                            {service.category}
                        </span>

                        <h1 className="text-3xl font-bold text-gray-800">{service.title}</h1>

                        {/* Rating Badge */}
                        {avgRating && (
                            <div className="flex items-center gap-2">
                                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                                <span className="font-semibold text-gray-700">{avgRating}</span>
                                <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="font-semibold text-gray-700 mb-3">About this service</h2>
                            <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                        </div>

                        {service.tags?.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {service.tags.map((tag) => (
                                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Provider Info */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <h2 className="font-semibold text-gray-700 mb-4">About the Provider</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white text-lg font-bold flex items-center justify-center">
                                    {service.provider?.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{service.provider?.name}</p>
                                    <p className="text-sm text-gray-500">
                                        ⭐ {service.provider?.rating || "New"} · {service.provider?.totalReviews || 0} reviews
                                    </p>
                                </div>
                            </div>
                            {service.provider?.bio && (
                                <p className="text-sm text-gray-600 mt-3">{service.provider.bio}</p>
                            )}
                            {service.provider?.skills?.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {service.provider.skills.map((skill) => (
                                        <span key={skill} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ⭐ Reviews Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Reviews ({reviews.length})
                                </h2>
                                {user && !isOwner && (
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        className="bg-amber-400 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                                    >
                                        ✍️ Write Review
                                    </button>
                                )}
                            </div>

                            {/* Rating Summary */}
                            <RatingSummary reviews={reviews} />

                            {/* Review Cards */}
                            {reviews.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                                    <div className="text-4xl mb-3">⭐</div>
                                    <p className="text-gray-500">Abhi koi review nahi hai</p>
                                    <p className="text-gray-400 text-sm mt-1">Pehle review dene wale bano!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {reviews.map((review) => (
                                        <ReviewCard key={review._id} review={review} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right — Booking Card */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-20">
                            <div className="text-center mb-6">
                                <span className="text-4xl font-extrabold text-indigo-600">
                                    {service.hoursRequired}
                                </span>
                                <span className="text-gray-500 text-sm ml-1">Time Credits</span>
                            </div>

                            {user && (
                                <div className="bg-indigo-50 rounded-lg p-3 text-center mb-4">
                                    <p className="text-xs text-gray-500">Your Balance</p>
                                    <p className="text-lg font-bold text-indigo-600">
                                        ⏱ {user.timeCredits} Credits
                                    </p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-600 px-3 py-2 rounded-lg text-sm mb-3">
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">
                                    {error}
                                </div>
                            )}

                            {!isOwner && !success && user && (
                                <>
                                    <textarea
                                        placeholder="Message to provider (optional)"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none mb-3"
                                    />
                                    <button
                                        onClick={handleBook}
                                        disabled={booking}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
                                    >
                                        {booking ? "Booking..." : "Book Service ⏱"}
                                    </button>
                                </>
                            )}

                            {isOwner && (
                                <div className="text-center text-sm text-gray-400">
                                    This is your service
                                </div>
                            )}

                            {!user && (
                                <button
                                    onClick={() => navigate("/login")}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
                                >
                                    Login to Book
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}