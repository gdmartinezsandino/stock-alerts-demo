import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { priceFeed } from "../services/priceFeed";
import { PriceUpdate } from "../services/finnhubSocket";
import { createLogger } from "../utils/logger";

const log = createLogger("socket.io");

/* Real-time relay to the mobile app.

   Clients authenticate with their JWT (handshake auth.token). On connect they
   receive the current price snapshot, then every price update is broadcast as
   a "price" event. This is what powers the live stock list and chart. */
export function initSocketIO(httpServer: HttpServer) {
  const io = new IOServer(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyToken(token);
      (socket.data as { userId: string }).userId = payload.sub;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    log.debug("Client connected", socket.id);
    socket.emit("snapshot", priceFeed.getSnapshot());
    socket.on("disconnect", () => log.debug("Client disconnected", socket.id));
  });

  // Fan out every price update to all connected clients.
  priceFeed.on("price", (update: PriceUpdate) => {
    io.emit("price", update);
  });

  return io;
}
