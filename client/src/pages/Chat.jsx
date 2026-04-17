import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { ensureSocketConnected, disconnectSocket } from "../utils/socket";
import { GlassCard, PageShell, Reveal, SectionHeading } from "../components/PremiumMotion";

export default function Chat() {
    const { user } = useAuth();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);
    const socketRef = useRef(null);
    const selectedRef = useRef(null);

    useEffect(() => {
        selectedRef.current = selected;
    }, [selected]);

    useEffect(() => {
        if (!user?._id) {
            disconnectSocket();
            return;
        }

        const socket = ensureSocketConnected(user._id);
        socketRef.current = socket;

        API.get("/messages/contacts")
            .then((res) => setUsers(res.data))
            .catch((err) => console.error(err));

        const onReceive = (data) => {
            const currentSelected = selectedRef.current;
            if (!currentSelected?._id) return;

            const senderId = String(data?.senderId || data?.sender?._id || data?.sender || "");
            const receiverId = String(data?.receiverId || data?.receiver?._id || data?.receiver || "");
            const selectedId = String(currentSelected._id);

            // Only append in the currently open conversation.
            if (senderId === selectedId || receiverId === selectedId) {
                setMessages((prev) => [...prev, data]);
            }
        };

        socket.on("receive_message", onReceive);
        return () => {
            socket.off("receive_message", onReceive);
        };
    }, [user]);

    useEffect(() => {
        const targetUserId = location.state?.userId;
        if (!targetUserId || users.length === 0 || selected?._id === targetUserId) return;

        const candidate = users.find((item) => item._id === targetUserId);
        if (candidate) {
            selectUser(candidate);
        }
    }, [location.state, users]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectUser = async (candidate) => {
        setSelected(candidate);
        try {
            const res = await API.get(`/messages/${candidate._id}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
            setMessages([]);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !selected) return;

        const text = input;
        setInput("");
        try {
            const { data: saved } = await API.post("/messages/send", { receiverId: selected._id, text });

            const msg = {
                _id: saved?._id,
                senderId: user._id,
                receiverId: selected._id,
                text: saved?.text || text,
                createdAt: saved?.createdAt || new Date().toISOString(),
            };

            socketRef.current?.emit("send_message", msg);
            setMessages((prev) => [...prev, { ...msg, sender: user._id, receiver: selected._id }]);
        } catch (err) {
            console.error(err);
            // restore input on failure
            setInput(text);
        }
    };

    return (
        <PageShell>
            <Navbar />
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <Reveal>
                    <div className="mb-6">
                        <SectionHeading
                            eyebrow="Chat"
                            title="Messages"
                            description="A calm, premium messaging workspace for quick collaboration and follow-ups."
                        />
                    </div>
                </Reveal>

                <GlassCard className="overflow-hidden p-0">
                    <div className="grid h-[34rem] lg:grid-cols-[280px_1fr]">
                        <aside className="border-b border-slate-100 bg-white/60 lg:border-b-0 lg:border-r">
                            <div className="border-b border-slate-100 px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">People</p>
                            </div>
                            <div className="max-h-[30rem] overflow-y-auto p-2">
                                {users.map((candidate) => (
                                    <button
                                        key={candidate._id}
                                        onClick={() => selectUser(candidate)}
                                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50 ${selected?._id === candidate._id ? "bg-indigo-50" : ""}`}
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 font-bold text-white shadow-lg shadow-indigo-500/25">
                                            {candidate.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{candidate.name}</p>
                                            <p className="text-xs text-slate-400 capitalize">{candidate.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <section className="flex min-h-0 flex-col">
                            {selected ? (
                                <>
                                    <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 font-bold text-white shadow-lg shadow-indigo-500/25">
                                            {selected.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
                                            <p className="text-xs text-slate-400">{selected.role}</p>
                                        </div>
                                    </header>

                                    <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white/30 to-slate-50/50 p-5">
                                        {messages.map((message, index) => {
                                            const senderId = String(message.sender?._id || message.senderId || message.sender || "");
                                            const isMine = senderId === String(user._id);
                                            return (
                                                <div key={index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[75%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isMine ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white" : "bg-white text-slate-700"}`}>
                                                        {message.text}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={bottomRef} />
                                    </div>

                                    <div className="border-t border-slate-100 bg-white/70 p-4">
                                        <div className="flex gap-3">
                                            <input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                                placeholder="Type a message..."
                                                className="premium-input"
                                            />
                                            <button onClick={sendMessage} className="premium-button px-5 py-3 text-sm">
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-white/40 to-slate-50/60 p-8 text-center text-slate-400">
                                    <div>
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-sky-500 text-2xl text-white shadow-lg shadow-indigo-500/25">
                                            💬
                                        </div>
                                        <p className="text-lg font-semibold text-slate-700">Select a user to start chatting</p>
                                        <p className="mt-2 text-sm text-slate-400">Conversations, responses, and follow-ups all live here.</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </GlassCard>
            </div>
        </PageShell>
    );
}