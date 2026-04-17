import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { GlassCard, PageShell, Reveal, SectionHeading, Stagger, StaggerItem } from "../components/PremiumMotion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState({ recentTransactions: [], upcomingMeetings: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/dashboard/stats"),
      API.get("/dashboard/activity"),
      API.get("/dashboard/recommendations"),
    ])
      .then(([statsRes, activityRes, recRes]) => {
        setStats(statsRes.data);
        setActivity(activityRes.data);
        setRecommendations(recRes.data?.suggestedServices || []);
      })
      .catch((err) => {
        console.error("Dashboard load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
      { label: "Total Credits", value: stats.credits ?? 0 },
      { label: "Pending Requests", value: stats.pendingRequests ?? 0 },
      { label: "Accepted Requests", value: stats.acceptedRequests ?? 0 },
      { label: "Completed Services", value: stats.completedServices ?? 0 },
      { label: "Total Earnings", value: `${stats.totalEarnings ?? 0}h` },
    ]
    : [];

  return (
    <PageShell>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Control Center"
            title="Your TalentTrade Dashboard"
            description="All important information in one place with a clean, modern, purple-accented experience."
          />
        </Reveal>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            <Stagger className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map((card) => (
                <StaggerItem key={card.label}>
                  <GlassCard className="h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(79,70,229,0.22)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-black text-violet-700">{card.value}</p>
                  </GlassCard>
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/services" className="premium-button px-5 py-3 text-sm">Browse Services</Link>
              <Link to="/post-service" className="premium-button px-5 py-3 text-sm">Post New Service</Link>
              <Link to="/transactions" className="premium-button px-5 py-3 text-sm">View Requests</Link>
              <Link to="/profile" className="premium-button px-5 py-3 text-sm">Edit Profile</Link>
            </div>

            <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <GlassCard className="p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-900">Monthly Credits Earned & Spent</h3>
                <p className="mt-1 text-xs text-slate-500">Track monthly trend for credits you earned and spent.</p>
                <div className="mt-5 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.monthlyCredits || []} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          borderRadius: "12px",
                          border: "1px solid #E2E8F0",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="earned"
                        name="Earned"
                        stroke="#7C3AED"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#7C3AED" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="spent"
                        name="Spent"
                        stroke="#A78BFA"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "#A78BFA" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-slate-900">Upcoming Meetings</h3>
                <div className="mt-4 space-y-3">
                  {activity.upcomingMeetings?.length ? (
                    activity.upcomingMeetings.map((meeting) => (
                      <div key={meeting._id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{meeting.service?.title || "Service"}</p>
                        <p className="text-xs text-slate-500">
                          {meeting.requester?.name || "Requester"} • {meeting.provider?.name || "Provider"}
                        </p>
                        {meeting.scheduledAt && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            {new Date(meeting.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        )}
                        {meeting.meetingUrl && (
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex premium-button premium-button-ghost px-4 py-2 text-xs"
                          >
                            Join meeting
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No upcoming meetings.</p>
                  )}
                </div>
              </GlassCard>
            </section>

            <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                <div className="mt-4 space-y-3">
                  {activity.recentTransactions?.length ? (
                    activity.recentTransactions.map((tx) => (
                      <div key={tx._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tx.service?.title || "Service"}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase text-violet-700">
                          {tx.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No recent activity.</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-slate-900">Recommended Services</h3>
                <div className="mt-4 space-y-3">
                  {recommendations.length ? (
                    recommendations.map((service) => (
                      <Link
                        key={service._id}
                        to={`/services/${service._id}`}
                        className="block rounded-2xl border border-slate-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300"
                      >
                        <p className="text-sm font-semibold text-slate-900">{service.title}</p>
                        <p className="text-xs text-slate-500">
                          {service.category} • {service.hoursRequired}h
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No recommended services yet.</p>
                  )}
                </div>
              </GlassCard>
            </section>
          </>
        )}
      </main>
    </PageShell>
  );
}
