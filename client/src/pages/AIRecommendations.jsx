import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";

export default function AIRecommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serviceId, setServiceId] = useState("");
    const [matchLoading, setMatchLoading] = useState(false);
    const [services, setServices] = useState([]);

    useEffect(() => {
        Promise.all([
            API.post("/ai/recommend", {}),
            API.get("/services/all"),
        ]).then(([rec, svc]) => {
            setRecommendations(rec.data.recommendations || []);
            setServices(svc.data.services || []);
        }).catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleMatch = async () => {
        if (!serviceId) return;
        setMatchLoading(true);
        try {
            const res = await API.post("/ai/match", { serviceId });
            setMatches(res.data.matches || []);
        } catch (err) {
            console.error(err);
        } finally {
            setMatchLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">🤖 AI Features</h1>
                    <p className="text-gray-500">Smart recommendations powered by Groq AI</p>
                </div>

                {/* AI Recommendations */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                        ✨ Recommended For You
                    </h2>
                    <p className="text-gray-400 text-sm mb-5">
                        Based on your skills and profile
                    </p>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400">
                            AI is finding best matches for you...
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            No recommendations found. Add more skills to your profile!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recommendations.map((rec, i) => (
                                <div key={i} className="border border-indigo-100 bg-indigo-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                            🤖 AI Pick
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm mb-1">{rec.title}</h3>
                                    <p className="text-gray-500 text-xs mb-3 leading-relaxed">{rec.reason}</p>
                                    <Link
                                        to={`/services/${rec.id}`}
                                        className="text-indigo-600 text-xs font-semibold hover:underline"
                                    >
                                        View Service →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Skill Matching */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                        🎯 AI Skill Matching
                    </h2>
                    <p className="text-gray-400 text-sm mb-5">
                        Find the best provider for any service
                    </p>

                    <div className="flex gap-3 mb-5">
                        <select
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">Select a service...</option>
                            {services.map((s) => (
                                <option key={s._id} value={s._id}>{s.title}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleMatch}
                            disabled={matchLoading || !serviceId}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {matchLoading ? "Matching..." : "Find Match 🎯"}
                        </button>
                    </div>

                    {matches.length > 0 && (
                        <div className="space-y-3">
                            {matches.map((match, i) => (
                                <div key={i} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                                            {match.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{match.name}</p>
                                            <p className="text-gray-400 text-xs">{match.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-extrabold text-indigo-600">
                                            {match.score}
                                        </div>
                                        <div className="text-xs text-gray-400">/ 10</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}