import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

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
        <PageShell>
            <Navbar />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <Reveal>
                    <div className="mb-8">
                        <SectionHeading
                            eyebrow="AI"
                            title="AI features"
                            description="Smart recommendations powered by Groq AI and presented with a premium, modern layout."
                        />
                    </div>
                </Reveal>

                <GlassCard className="mb-8 p-6">
                    <h2 className="mb-1 text-xl font-bold text-slate-900">✨ Recommended For You</h2>
                    <p className="mb-5 text-sm text-slate-400">Based on your skills and profile</p>

                    {loading ? (
                        <div className="py-8 text-center text-slate-400">AI is finding best matches for you...</div>
                    ) : recommendations.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">No recommendations found. Add more skills to your profile!</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {recommendations.map((recommendation, index) => (
                                <div key={index} className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">🤖 AI Pick</span>
                                    </div>
                                    <h3 className="mb-1 text-sm font-bold text-slate-900">{recommendation.title}</h3>
                                    <p className="mb-3 text-xs leading-relaxed text-slate-500">{recommendation.reason}</p>
                                    <Link to={`/services/${recommendation.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                                        View Service →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <GlassCard className="mb-8 p-6">
                    <h2 className="mb-1 text-xl font-bold text-slate-900">🎯 AI Skill Matching</h2>
                    <p className="mb-5 text-sm text-slate-400">Find the best provider for any service</p>

                    <div className="mb-5 flex gap-3">
                        <select
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            className="premium-select flex-1"
                        >
                            <option value="">Select a service...</option>
                            {services.map((service) => (
                                <option key={service._id} value={service._id}>{service.title}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleMatch}
                            disabled={matchLoading || !serviceId}
                            className="premium-button px-6 py-2 text-sm disabled:opacity-50"
                        >
                            {matchLoading ? "Matching..." : "Find Match 🎯"}
                        </button>
                    </div>

                    {matches.length > 0 && (
                        <div className="space-y-3">
                            {matches.map((match, index) => (
                                <div key={index} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/70 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 font-bold text-white">{match.name?.[0]?.toUpperCase()}</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{match.name}</p>
                                            <p className="text-xs text-slate-400">{match.reason}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-extrabold text-indigo-600">{match.score}</div>
                                        <div className="text-xs text-slate-400">/ 10</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </PageShell>
    );
}