import { EventEmitter } from "events";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";
import { finnhubSocket, PriceUpdate } from "./finnhubSocket";
import { getQuote } from "./finnhubRest";

const log = createLogger("price-feed");

/* Unified price feed.

   Live trades come from the Finnhub WebSocket. But that stream is silent
   outside US market hours, which would make a demo look broken. To keep the
   UI and alert engine alive at all times, we also poll REST quotes on an
   interval and emit them as price updates *only when the socket has gone
   quiet* for a symbol. This is a safety net, not the primary source.

   Consumers just listen for "price" (PriceUpdate) and don't care which
   underlying source produced it. */
class PriceFeed extends EventEmitter {
  private pollTimer: NodeJS.Timeout | null = null;
  private lastEmitAt = new Map<string, number>();
  private readonly stalenessMs = 10000; // poll only fills gaps > this
  private readonly pollIntervalMs = 8000;

  start() {
    finnhubSocket.start(env.trackedSymbols);
    finnhubSocket.on("price", (update: PriceUpdate) => {
      this.lastEmitAt.set(update.symbol, Date.now());
      this.emit("price", update);
    });
    this.startPolling();
    log.info("Price feed started", { symbols: env.trackedSymbols });
  }

  getSnapshot(): PriceUpdate[] {
    return finnhubSocket.getLastPrices();
  }

  trackSymbol(symbol: string) {
    finnhubSocket.subscribe(symbol);
  }

  private startPolling() {
    this.pollTimer = setInterval(() => this.pollOnce(), this.pollIntervalMs);
  }

  private async pollOnce() {
    const now = Date.now();
    for (const symbol of env.trackedSymbols) {
      const lastLive = this.lastEmitAt.get(symbol) ?? 0;
      if (now - lastLive < this.stalenessMs) continue; // socket is fresh
      try {
        const q = await getQuote(symbol);
        if (!q.current) continue;
        const update: PriceUpdate = {
          symbol,
          price: q.current,
          timestamp: now,
        };
        this.lastEmitAt.set(symbol, now);
        this.emit("price", update);
      } catch (err) {
        log.debug(`Poll failed for ${symbol}`, (err as Error).message);
      }
    }
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    finnhubSocket.stop();
  }
}

export const priceFeed = new PriceFeed();
