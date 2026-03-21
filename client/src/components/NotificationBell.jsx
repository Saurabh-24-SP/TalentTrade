import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NOTIF_ICONS = {
    booking_request: { icon: '🔔', bg: 'bg-amber-100' },
    booking_accepted: { icon: '✅', bg: 'bg-green-100' },
    booking_declined: { icon: '❌', bg: 'bg-red-100' },
    booking_completed: { icon: '🎉', bg: 'bg-purple-100' },
    new_message: { icon: '💬', bg: 'bg-blue-100' },
    credit_earned: { icon: '💰', bg: 'bg-green-100' },
    credit_deducted: { icon: '💸', bg: 'bg-amber-100' },
    new_review: { icon: '⭐', bg: 'bg-yellow-100' },
    service_approved: { icon: '✅', bg: 'bg-green-100' },
    fraud_alert: { icon: '🚨', bg: 'bg-red-100' },
    system: { icon: 'ℹ️', bg: 'bg-gray-100' },
};

const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'abhi';
    if (s < 3600) return `${Math.floor(s / 60)}m pehle`;
    if (s < 86400) return `${Math.floor(s / 3600)}h pehle`;
    return `${Math.floor(s / 86400)}d pehle`;
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('/api/notifications?limit=15', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Real-time notifications via socket
    // useEffect(() => {
    //     if (!socket) return;
    //     const handler = (notif) => {
    //         setNotifications((prev) => [notif, ...prev]);
    //         setUnreadCount((c) => c + 1);
    //     };
    //     socket.on('new_notification', handler);
    //     return () => socket.off('new_notification', handler);
    // }, [socket]);

    // Outside click se close karo
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClick = (notif) => {
        if (!notif.read) markAsRead(notif._id);
        if (notif.actionUrl) navigate(notif.actionUrl);
        setOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-indigo-50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Sab read karo
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-96 divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="text-4xl mb-3">🔕</div>
                                <p className="text-gray-500 text-sm">Koi notification nahi</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
                                return (
                                    <button
                                        key={notif._id}
                                        onClick={() => handleClick(notif)}
                                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition ${!notif.read ? 'bg-indigo-50/50' : ''
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${cfg.bg}`}>
                                            {cfg.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium truncate ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notif.body}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {timeAgo(notif.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={() => { navigate('/notifications'); setOpen(false); }}
                            className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1"
                        >
                            Sabhi notifications dekho →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}