import { io, Socket } from "socket.io-client";
import { config } from "../config";
import { getToken } from "../api/client";
import { PriceUpdate } from "../types";

/* Singleton Socket.IO client connecting to the backend live price relay.
   Authenticated with the same JWT used for REST calls. */

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(config.socketUrl, {
    transports: ["websocket"],
    auth: { token: getToken() },
    autoConnect: true,
  });
  return socket;
}

export function reconnectWithFreshAuth() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
}

export function onPrice(handler: (update: PriceUpdate) => void): () => void {
  const s = getSocket();
  s.on("price", handler);
  return () => s.off("price", handler);
}

export function onSnapshot(handler: (snapshot: PriceUpdate[]) => void): () => void {
  const s = getSocket();
  s.on("snapshot", handler);
  return () => s.off("snapshot", handler);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
