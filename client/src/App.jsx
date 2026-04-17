import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/AIChatbot";
import SearchPage from './pages/SearchPage';
import MapView from './components/MapView';
import { AnimatePresence, motion } from "framer-motion";

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
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <div className="glass-card border border-indigo-100/70 bg-white/90 p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-2xl text-white shadow-lg shadow-indigo-500/25">
            ✨
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Install TalentTrade AI</p>
            <p className="text-xs text-slate-500">A smoother, app-like experience with offline support.</p>
          </div>
          <button
            onClick={handleInstall}
            className="premium-button px-4 py-2 text-xs"
          >
            Install
          </button>
          <button onClick={handleDismiss} className="text-slate-400 transition hover:text-slate-700">
            ×
          </button>
        </div>
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
    <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] -translate-x-1/2 md:w-auto">
      <div className="glass-card flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-soft">
        <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,0.14)]"></span>
        You are offline - some features may not work
      </div>
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

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);

function AnimatedAppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <PageTransition><Register /></PageTransition>} />
        <Route path="/services" element={<PageTransition><BrowseServices /></PageTransition>} />
        <Route path="/services/:id" element={<PageTransition><ServiceDetail /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/map" element={<PageTransition><MapView /></PageTransition>} />

        <Route path="/post-service" element={<ProtectedRoute><PageTransition><PostService /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/my-services" element={<ProtectedRoute><PageTransition><MyServices /></PageTransition></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><PageTransition><MyTransactions /></PageTransition></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><PageTransition><CreditDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><PageTransition><Chat /></PageTransition></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><PageTransition><AIRecommendations /></PageTransition></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {/* PWA Banners */}
      <OfflineBanner />
      <InstallBanner />

      <AnimatedAppRoutes />

      {/* AI Chatbot */}
      {user && <AIChatbot />}
    </BrowserRouter>
  );
}

export default App;