import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from './NotificationBell';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-decoration-none">
                    <span className="text-2xl">💡</span>
                    <span className="text-xl font-bold text-indigo-600">TalentTrade</span>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                        AI
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-6">
                    <Link to="/services" className="text-gray-600 text-sm font-medium hover:text-indigo-600 transition">
                        Browse Services
                    </Link>

                    {user ? (
                        <>
                            <Link to="/post-service" className="text-gray-600 text-sm font-medium hover:text-indigo-600 transition">
                                + Post Service
                            </Link>

                            <Link to="/transactions" className="text-gray-600 text-sm font-medium hover:text-indigo-600 transition">
                                My Requests
                            </Link>

                            {/* Credits Badge */}
                            <Link to="/credits" className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-indigo-100 transition">
                                ⏱ {user.timeCredits} Credits
                            </Link>
                            <NotificationBell  />

                            {/* Admin Link */}
                            {user.role === "admin" && (
                                <Link to="/admin" className="text-red-500 text-sm font-medium hover:text-red-700 transition">
                                    Admin
                                </Link>
                            )}

                            {/* Profile Avatar */}
                            <div className="flex items-center gap-2">
                                <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-200 flex items-center justify-center">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 text-sm border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-600 text-sm font-medium hover:text-indigo-600 transition">
                                Login
                            </Link>
                            <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}