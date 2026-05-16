import { io } from "socket.io-client";

let socket = null;

/**
 * Initialize socket connection (call once after login)
 */
export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io("/", {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    console.log("🔌 [Socket] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 [Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("🔌 [Socket] Connection error:", err.message);
  });

  return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = () => {
  if (!socket || !socket.connected) {
    return connectSocket();
  }
  return socket;
};

/**
 * Disconnect socket (call on logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, getSocket, disconnectSocket };
