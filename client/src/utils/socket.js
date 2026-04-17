import { io } from "socket.io-client";
import API from "./api";

let socketInstance = null;
let currentUserId = null;

const getSocketServerUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || API.defaults.baseURL || "http://localhost:5001/api";
    return apiBaseUrl.replace(/\/api\/?$/, "");
};

export const getSocket = () => socketInstance;

export const ensureSocketConnected = (userId) => {
    if (userId) currentUserId = userId;

    if (!socketInstance) {
        socketInstance = io(getSocketServerUrl(), {
            transports: ["polling", "websocket"],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 4000,
        });

        socketInstance.on("connect", () => {
            if (currentUserId) {
                socketInstance.emit("join_user_room", currentUserId);
                socketInstance.emit("user_online", currentUserId);
            }
        });
    }

    if (!socketInstance.connected) {
        socketInstance.connect();
    } else if (currentUserId) {
        // if already connected and user changed
        socketInstance.emit("join_user_room", currentUserId);
        socketInstance.emit("user_online", currentUserId);
    }

    return socketInstance;
};

export const disconnectSocket = () => {
    currentUserId = null;
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};
