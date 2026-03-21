import { createContext, useContext, useState, useEffect } from "react";
import API from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            API.get("/auth/me")
                .then((res) => setUser(res.data))
                .catch(() => localStorage.removeItem("token"))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Register
    const register = async (data) => {
        const res = await API.post("/auth/register", data);
        localStorage.setItem("token", res.data.token);
        setUser(res.data);
        return res.data;
    };

    // Login
    const login = async (data) => {
        const res = await API.post("/auth/login", data);
        localStorage.setItem("token", res.data.token);
        setUser(res.data);
        return res.data;
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);