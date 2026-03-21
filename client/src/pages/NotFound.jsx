import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="text-8xl mb-6">⏰</div>
                <h1 className="text-6xl font-extrabold text-indigo-600 mb-3">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Page Not Found</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    The page you are looking for does not exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center">
                    <Link
                        to="/"
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Go Home
                    </Link>
                    <Link
                        to="/services"
                        className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
                    >
                        Browse Services
                    </Link>
                </div>
            </div>
        </div>
    );
}