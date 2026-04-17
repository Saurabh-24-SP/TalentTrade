import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowRight, FiMenu, FiPlus, FiShield, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const navLinks = [
        ...(user ? [{ to: "/dashboard", label: "Dashboard" }] : []),
        { to: "/services", label: "Browse" },
        ...(user ? [
            { to: "/search", label: "Search" },
            { to: "/credits", label: "Credits" },
            { to: "/profile", label: "Profile" },
        ] : []),
    ];

    const closeMenu = () => setOpen(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
        closeMenu();
    };

    return (
        <>
            <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/60 backdrop-blur-2xl shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link to="/" className="group flex items-center gap-3" onClick={closeMenu}>
                        <div className="flex h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-100 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                            <img
                                src="/TalentTradeAI.png"
                                alt="TalentTrade AI"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-slate-900">
                                <span className="text-lg font-extrabold tracking-tight">TalentTrade</span>
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">AI</span>
                            </div>
                            <p className="text-xs text-slate-500">Premium skill exchange</p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 lg:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${location.pathname === link.to ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {user ? (
                            <>
                                <Link to="/post-service" className="premium-button px-4 py-2 text-sm">
                                    <FiPlus className="text-base" /> Post Service
                                </Link>
                                <Link to="/credits" className="rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5">
                                    ⏱ {user.timeCredits} Credits
                                </Link>
                                <NotificationBell />
                                {user.role === "admin" && (
                                    <Link to="/admin" className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
                                        Admin
                                    </Link>
                                )}
                                <Link to="/profile" className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                    <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-indigo-100 transition duration-300 group-hover:scale-105">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-bold text-white">
                                                {user.name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left leading-tight">
                                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                        <p className="text-[11px] text-slate-500">View profile</p>
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                                    Login
                                </Link>
                                <Link to="/register" className="premium-button px-4 py-2 text-sm">
                                    Get Started <FiArrowRight />
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setOpen((value) => !value)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900 lg:hidden"
                        aria-label="Toggle menu"
                    >
                        {open ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
                        onClick={closeMenu}
                    >
                        <motion.div
                            initial={{ y: -18, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -18, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute left-0 right-0 top-0 border-b border-white/60 bg-white/95 p-4 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FiShield className="text-indigo-600" />
                                    <p className="text-sm font-semibold text-slate-900">Navigation</p>
                                </div>
                                <button onClick={closeMenu} className="text-slate-500">
                                    <FiX />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {navLinks.map((link) => (
                                    <Link key={link.to} to={link.to} onClick={closeMenu} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                                        <span>{link.label}</span>
                                        <FiArrowRight className="text-slate-400" />
                                    </Link>
                                ))}
                                {user ? (
                                    <>
                                        <Link to="/post-service" onClick={closeMenu} className="flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
                                            <span>Post Service</span>
                                            <FiPlus />
                                        </Link>
                                        <Link to="/transactions" onClick={closeMenu} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                                            <span>My Requests</span>
                                            <FiArrowRight className="text-slate-400" />
                                        </Link>
                                        <button onClick={handleLogout} className="flex w-full items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                                            <span>Logout</span>
                                            <FiX />
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Link to="/login" onClick={closeMenu} className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                            Login
                                        </Link>
                                        <Link to="/register" onClick={closeMenu} className="rounded-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white">
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}