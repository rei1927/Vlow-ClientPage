import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

/**
 * Initialize Socket.io server
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    // Performance: reduce overhead
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  // Auth middleware — validate JWT from cookie or query
  io.use((socket, next) => {
    try {
      // Try cookie first (same as HTTP auth)
      const cookies = socket.handshake.headers.cookie || "";
      const tokenMatch = cookies.match(/token=([^;]+)/);
      let token = tokenMatch ? tokenMatch[1] : null;

      // Fallback: query param (for cases where cookies don't work)
      if (!token) {
        token = socket.handshake.auth?.token;
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`🔌 [Socket] User ${userId} connected (${socket.id})`);

    // Join user-specific room for targeted events
    socket.join(`user:${userId}`);

    // Client can join a specific platform room to get chat updates
    socket.on("join:platform", (platformId) => {
      socket.join(`platform:${platformId}`);
      console.log(`🔌 [Socket] User ${userId} joined platform:${platformId}`);
    });

    socket.on("leave:platform", (platformId) => {
      socket.leave(`platform:${platformId}`);
    });

    // Client can join a specific chat room for message updates
    socket.on("join:chat", ({ platformId, chatId }) => {
      socket.join(`chat:${platformId}:${chatId}`);
      console.log(`🔌 [Socket] User ${userId} joined chat:${platformId}:${chatId}`);
    });

    socket.on("leave:chat", ({ platformId, chatId }) => {
      socket.leave(`chat:${platformId}:${chatId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [Socket] User ${userId} disconnected: ${reason}`);
    });
  });

  return io;
};

/**
 * Get the Socket.io instance
 * @returns {Server}
 */
export const getIO = () => {
  if (!io) {
    console.warn("[Socket] Socket.io not initialized yet");
  }
  return io;
};

/**
 * Emit a new message event to clients watching a specific chat
 */
export const emitNewMessage = (platformId, chatId, message) => {
  if (!io) return;
  // Emit to everyone watching this specific chat
  io.to(`chat:${platformId}:${chatId}`).emit("message:new", {
    platformId,
    chatId,
    message,
  });
  // Also emit a lighter "chat updated" event to the platform room (for sidebar)
  io.to(`platform:${platformId}`).emit("chat:updated", {
    chatId,
    lastMessage: { body: message.body || message.text || "" },
    timestamp: message.timestamp || Math.floor(Date.now() / 1000),
  });
};

/**
 * Emit chat list update (new chat or chat order changed)
 */
export const emitChatListUpdate = (platformId) => {
  if (!io) return;
  io.to(`platform:${platformId}`).emit("chatlist:refresh");
};

/**
 * Emit handover status change
 */
export const emitHandoverChange = (platformId, chatId, status) => {
  if (!io) return;
  io.to(`platform:${platformId}`).emit("handover:changed", {
    chatId,
    status,
  });
};
