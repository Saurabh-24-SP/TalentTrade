import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BrowseServices from "./pages/BrowseServices";
import ServiceDetail from "./pages/ServiceDetail";
import PostService from "./pages/PostService";
import MyTransactions from "./pages/MyTransactions";
import CreditDashboard from "./pages/CreditDashboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";
import AIRecommendations from "./pages/AIRecommendations";
import MyServices from "./pages/MyServices";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/AIChatbot";
import SearchPage from './pages/SearchPage';
import MapView from './components/MapView';

// ─── PWA Install Banner ────────────────────────────────────────────────────────
function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwa-dismissed') === 'true'
  );

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installPrompt || dismissed) return null;

  const handleInstall = async () => {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-indigo-600 text-white shadow-2xl">
      <div className="max-w-md mx-auto flex items-center gap-4">
        <span className="text-3xl">⏱️</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">Install TalentTradeAI</p>
          <p className="text-indigo-200 text-xs">App ki tarah use karo — offline bhi!</p>
        </div>
        <button onClick={handleInstall}
          className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition flex-shrink-0">
          Install
        </button>
        <button onClick={handleDismiss}
          className="text-indigo-200 hover:text-white text-xl flex-shrink-0">
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Offline Banner ────────────────────────────────────────────────────────────
function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white text-sm text-center py-2 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
      Aap offline hain — kuch features kaam nahi karenge
    </div>
  );
}

// ─── Protected Routes ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-indigo-600 text-xl font-bold">Loading...</p>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === "admin" ? children : <Navigate to="/" />;
};

// ─── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {/* PWA Banners */}
      <OfflineBanner />
      <InstallBanner />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/services" element={<BrowseServices />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/map" element={<MapView />} />

        {/* Protected Routes */}
        <Route path="/post-service" element={<ProtectedRoute><PostService /></ProtectedRoute>} />
        <Route path="/my-services" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><MyTransactions /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><CreditDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIRecommendations /></ProtectedRoute>} />

        {/* Admin Route */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* AI Chatbot */}
      {user && <AIChatbot />}
    </BrowserRouter>
  );
}

export default App;