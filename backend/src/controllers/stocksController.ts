import { Request, Response } from "express";
import { env } from "../config/env";
import { getQuote, getProfile, getQuoteHistory } from "../services/finnhubRest";
import { priceFeed } from "../services/priceFeed";

/* Returns the tracked stock universe with the latest quote for each.
   Uses the in-memory live snapshot where available, falling back to a REST
   quote so the list is always populated on first load. */
export async function listStocks(_req: Request, res: Response) {
  const snapshot = new Map(priceFeed.getSnapshot().map((p) => [p.symbol, p]));

  const stocks = await Promise.all(
    env.trackedSymbols.map(async (symbol) => {
      const live = snapshot.get(symbol);
      const quote = await getQuote(symbol).catch(() => null);
      return {
        symbol,
        name: symbol,
        price: live?.price ?? quote?.current ?? null,
        change: quote?.change ?? null,
        percentChange: quote?.percentChange ?? null,
        high: quote?.high ?? null,
        low: quote?.low ?? null,
        open: quote?.open ?? null,
        previousClose: quote?.previousClose ?? null,
        updatedAt: live?.timestamp ?? Date.now(),
      };
    })
  );

  return res.json({ stocks });
}

export async function getStock(req: Request, res: Response) {
  const symbol = req.params.symbol.toUpperCase();
  const [quote, profile, history] = await Promise.all([
    getQuote(symbol),
    getProfile(symbol).catch(() => null),
    getQuoteHistory(symbol).catch(() => []),
  ]);
  return res.json({ symbol, quote, profile, history });
}

export async function getStockHistory(req: Request, res: Response) {
  const symbol = req.params.symbol.toUpperCase();
  const history = await getQuoteHistory(symbol);
  return res.json({ symbol, history });
}
