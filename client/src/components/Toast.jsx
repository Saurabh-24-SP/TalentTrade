import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const toastStyles = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
};

const toastIcons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
};

export function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl ${toastStyles[type]}`}
        >
            <span className="text-base">{toastIcons[type]}</span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-1 opacity-60 transition hover:opacity-100">✕</button>
        </motion.div>
    );
}

// Toast Hook
export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const hideToast = () => setToast(null);

    const ToastComponent = toast ? (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
    ) : null;

    return { showToast, ToastComponent };
}