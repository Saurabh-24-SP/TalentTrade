import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import MeetingRoom from "../components/MeetingRoom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

export default function ServiceMeeting() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [serviceTitle, setServiceTitle] = useState("");
    const [providerName, setProviderName] = useState("");

    const roomId = useMemo(() => `service_${id}`, [id]);

    useEffect(() => {
        let active = true;
        API.get(`/services/${id}`)
            .then((res) => {
                if (!active) return;
                setServiceTitle(res.data?.title || "");
                setProviderName(res.data?.provider?.name || "");
            })
            .catch(() => {
                // Non-blocking for meeting UX
            });
        return () => {
            active = false;
        };
    }, [id]);

    return (
        <PageShell>
            <Navbar />

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <SectionHeading
                                eyebrow="Real-time"
                                title="Video Meeting"
                                description={serviceTitle ? `Service: ${serviceTitle}${providerName ? ` · Provider: ${providerName}` : ""}` : "Join the real-time meeting for this service."}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/services/${id}`)}
                            className="premium-button premium-button-ghost px-5 py-3 text-sm"
                        >
                            Back to Service
                        </button>
                    </div>
                </Reveal>

                <GlassCard className="p-6 md:p-8">
                    <MeetingRoom
                        roomId={roomId}
                        userId={user?._id}
                        onLeave={() => navigate(`/services/${id}`)}
                    />
                </GlassCard>
            </div>
        </PageShell>
    );
}
