import { env } from "../config/env";
import { AppError } from "../utils/errors";

/* Thin wrapper around Finnhub's REST API (Node 20 global fetch). */

export interface Quote {
  symbol: string;
  current: number; // c
  change: number; // d
  percentChange: number; // dp
  high: number; // h
  low: number; // l
  open: number; // o
  previousClose: number; // pc
}

export interface SymbolProfile {
  symbol: string;
  name: string;
  logo?: string;
  exchange?: string;
  currency?: string;
}

async function finnhubGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${env.finnhubRestUrl}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("token", env.finnhubApiKey);

  const res = await fetch(url.toString());
  if (res.status === 429) {
    throw new AppError(429, "Finnhub rate limit reached, try again shortly", "RATE_LIMIT");
  }
  if (!res.ok) {
    throw new AppError(502, `Finnhub request failed (${res.status})`, "FINNHUB_ERROR");
  }
  return (await res.json()) as T;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const raw = await finnhubGet<{
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
  }>("/quote", { symbol });

  return {
    symbol: symbol.toUpperCase(),
    current: raw.c,
    change: raw.d,
    percentChange: raw.dp,
    high: raw.h,
    low: raw.l,
    open: raw.o,
    previousClose: raw.pc,
  };
}

export async function getProfile(symbol: string): Promise<SymbolProfile> {
  const raw = await finnhubGet<{
    name?: string;
    logo?: string;
    exchange?: string;
    currency?: string;
  }>("/stock/profile2", { symbol });

  return {
    symbol: symbol.toUpperCase(),
    name: raw.name ?? symbol.toUpperCase(),
    logo: raw.logo,
    exchange: raw.exchange,
    currency: raw.currency,
  };
}

export interface CandlePoint {
  t: number; // unix seconds
  c: number; // close price
}

/* Finnhub's free /stock/candle endpoint is restricted on many keys, so the
   chart history is synthesised from the daily quote (open/prevClose/high/low
   plus current) to guarantee the graph always renders. If you have a paid key,
   swap this for a real /stock/candle call. */
export async function getQuoteHistory(symbol: string): Promise<CandlePoint[]> {
  const q = await getQuote(symbol);
  const now = Math.floor(Date.now() / 1000);
  const hour = 3600;
  // A plausible intraday path: prevClose -> open -> low -> high -> current.
  const seq = [q.previousClose, q.open, q.low, q.high, q.current].filter(
    (v) => typeof v === "number" && v > 0
  );
  return seq.map((c, i) => ({ t: now - (seq.length - 1 - i) * hour, c }));
}
