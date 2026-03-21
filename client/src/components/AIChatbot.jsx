import { useState, useRef, useEffect } from "react";
import API from "../utils/api";

export default function AIChatbot() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);
    const [messages, setMessages] = useState([
        { from: "bot", text: "Hi! I am your TalentTradeAI assistant 🤖 How can I help you today?" }
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
        <div className="fixed bottom-6 right-6 z-50">

            {/* Chat Window */}
            {open && (
                <div className="w-80 h-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col mb-3 overflow-hidden">

                    {/* Header */}
                    <div className="bg-indigo-600 px-4 py-3 text-white">
                        <p className="font-bold text-sm">🤖 AI Assistant</p>
                        <p className="text-xs text-indigo-200">Time Bank Support</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`px-3 py-2 rounded-xl text-sm max-w-xs leading-relaxed
                  ${msg.from === "user"
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm">
                                    Typing...
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder="Ask me anything..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setOpen(!open)}
                className="w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center"
            >
                {open ? "✕" : "🤖"}
            </button>
        </div>
    );
}