import { useState, useEffect, useRef } from "react";
import API from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        if (user) {
            socket.emit("user_online", user._id);
            API.get("/admin/users")
                .then((res) => setUsers(res.data.filter((u) => u._id !== user._id)))
                .catch((err) => console.error(err));
        }

        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        return () => socket.off("receive_message");
    }, [user]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectUser = async (u) => {
        setSelected(u);
        const res = await API.get(`/messages/${u._id}`);
        setMessages(res.data);
    };

    const sendMessage = async () => {
        if (!input.trim() || !selected) return;
        const msg = {
            senderId: user._id,
            receiverId: selected._id,
            text: input,
            createdAt: new Date(),
        };
        socket.emit("send_message", msg);
        await API.post("/messages/send", { receiverId: selected._id, text: input });
        setMessages((prev) => [...prev, { ...msg, sender: { _id: user._id } }]);
        setInput("");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">💬 Messages</h1>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[500px]">

                    {/* Users List */}
                    <div className="w-64 border-r border-gray-100 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-600">All Users</p>
                        </div>
                        {users.map((u) => (
                            <div
                                key={u._id}
                                onClick={() => selectUser(u)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition
                  ${selected?._id === u._id ? "bg-indigo-50" : ""}`}
                            >
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                                    {u.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selected ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                                        {selected.name?.[0]?.toUpperCase()}
                                    </div>
                                    <p className="font-semibold text-gray-800">{selected.name}</p>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {messages.map((msg, i) => {
                                        const isMine = (msg.sender?._id || msg.senderId) === user._id;
                                        return (
                                            <div key={i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                <div className={`px-4 py-2 rounded-xl text-sm max-w-xs
                          ${isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"}`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t border-gray-100 flex gap-2">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                                    >
                                        Send
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                Select a user to start chatting
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}