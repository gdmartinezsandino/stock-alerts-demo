import { EventEmitter } from "events";
import WebSocket from "ws";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("finnhub-ws");

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number; // ms
  volume?: number;
}

/* Maintains a single resilient WebSocket connection to Finnhub, subscribes to
   the tracked symbols, and re-emits normalised trade ticks as "price" events.

   Other services (Socket.IO relay, alert engine) consume this without knowing
   anything about Finnhub's wire format. */
class FinnhubSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private symbols = new Set<string>();
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private heartbeat: NodeJS.Timeout | null = null;
  private lastPrices = new Map<string, PriceUpdate>();

  start(symbols: string[]) {
    symbols.forEach((s) => this.symbols.add(s.toUpperCase()));
    this.connect();
  }

  getLastPrices(): PriceUpdate[] {
    return [...this.lastPrices.values()];
  }

  getLastPrice(symbol: string): PriceUpdate | undefined {
    return this.lastPrices.get(symbol.toUpperCase());
  }

  subscribe(symbol: string) {
    const sym = symbol.toUpperCase();
    this.symbols.add(sym);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
    }
  }

  private connect() {
    const url = `${env.finnhubWsUrl}?token=${env.finnhubApiKey}`;
    log.info("Connecting to Finnhub WebSocket");
    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      log.info("Connected; subscribing to symbols", [...this.symbols]);
      this.reconnectDelay = 1000;
      this.symbols.forEach((symbol) =>
        this.ws?.send(JSON.stringify({ type: "subscribe", symbol }))
      );
      this.startHeartbeat();
    });

    this.ws.on("message", (raw: WebSocket.RawData) => this.handleMessage(raw));

    this.ws.on("close", () => {
      log.warn("Connection closed, scheduling reconnect");
      this.cleanup();
      this.scheduleReconnect();
    });

    this.ws.on("error", (err) => {
      log.error("WebSocket error", err.message);
      // 'close' will follow and handle reconnection.
    });
  }

  private handleMessage(raw: WebSocket.RawData) {
    let msg: { type?: string; data?: Array<{ s: string; p: number; t: number; v: number }> };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type !== "trade" || !Array.isArray(msg.data)) return;

    // Finnhub can send many ticks per symbol in one frame; keep the latest.
    const latestBySymbol = new Map<string, PriceUpdate>();
    for (const tick of msg.data) {
      latestBySymbol.set(tick.s, {
        symbol: tick.s,
        price: tick.p,
        timestamp: tick.t,
        volume: tick.v,
      });
    }
    for (const update of latestBySymbol.values()) {
      this.lastPrices.set(update.symbol, update);
      this.emit("price", update);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.ping();
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }

  private cleanup() {
    this.stopHeartbeat();
    this.ws?.removeAllListeners();
    this.ws = null;
  }

  private scheduleReconnect() {
    setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  stop() {
    this.cleanup();
    this.ws?.close();
  }
}

// Singleton shared across the app.
export const finnhubSocket = new FinnhubSocketService();
