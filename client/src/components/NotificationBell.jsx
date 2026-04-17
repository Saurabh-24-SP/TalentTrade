import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { FiBell, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

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
    const { user, setUser } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);
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
    useEffect(() => {
        if (!user?._id) return;

        const apiBaseUrl = API.defaults.baseURL || 'http://localhost:5000/api';
        const socketServerUrl = apiBaseUrl.replace(/\/api\/?$/, '');
        const socket = io(socketServerUrl, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_user_room', user._id);
            socket.emit('user_online', user._id);
        });

        const handler = (notif) => {
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((count) => count + 1);

            const pushedBalance = notif?.data?.newBalance;
            if (typeof pushedBalance === 'number') {
                setUser((prev) => (prev ? { ...prev, timeCredits: pushedBalance } : prev));
            }
        };

        socket.on('new_notification', handler);

        return () => {
            socket.off('new_notification', handler);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?._id, setUser]);

    // Close on outside click
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
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900"
            >
                <FiBell className="text-lg" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white shadow-lg shadow-rose-500/30">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                    className="absolute right-0 mt-3 w-80 overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl z-50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                            >
                                <FiCheckCircle /> Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🔕</div>
                                <p className="text-sm text-slate-500">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
                                return (
                                    <button
                                        key={notif._id}
                                        onClick={() => handleClick(notif)}
                                        className={`w-full text-left px-4 py-3.5 flex gap-3 transition hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50/50' : ''
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl text-lg ${cfg.bg}`}>
                                            {cfg.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`truncate text-sm font-medium ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.read && (
                                                    <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-indigo-500"></span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                                {notif.body}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {timeAgo(notif.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2">
                        <button
                            onClick={() => { navigate('/notifications'); setOpen(false); }}
                            className="inline-flex w-full items-center justify-center gap-1 rounded-2xl px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-white hover:text-indigo-800"
                        >
                            View all notifications <FiExternalLink />
                        </button>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}