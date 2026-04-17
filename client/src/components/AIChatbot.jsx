import { useEffect, useRef, useState } from "react";
import API from "../utils/api";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";

export default function AIChatbot() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [messages, setMessages] = useState([
        { from: "bot", text: "Hi! I am your TalentTrade AI assistant. How can I help you today?" },
    ]);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { from: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await API.post("/ai/chat", { message: input, history });
            setHistory(res.data.history);
            setMessages((prev) => [...prev, { from: "bot", text: res.data.reply }]);
        } catch {
            setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I could not process that. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-chatbot-root fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.24 }}
                        className="mb-3 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 px-4 py-4 text-white">
                            <div>
                                <p className="text-sm font-bold">AI Assistant</p>
                                <p className="text-xs text-white/75">Premium support for TalentTrade</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                                <FiMessageCircle className="text-lg" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto p-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${message.from === "user" ? "bg-gradient-to-r from-indigo-600 to-sky-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                                        {message.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 shadow-sm">Typing...</div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="flex gap-2 border-t border-slate-100 p-3">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder="Ask me anything..."
                                className="premium-input"
                            />
                            <motion.button
                                onClick={sendMessage}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                                className="premium-button px-4 py-3 text-sm"
                            >
                                <FiSend />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setOpen((value) => !value)}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 text-white shadow-[0_16px_50px_rgba(79,70,229,0.35)] transition"
            >
                {open ? <FiX className="text-xl" /> : <FiMessageCircle className="text-xl" />}
            </motion.button>
        </div>
    );
}