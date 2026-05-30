export interface User {
  id: string;
  email: string;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  percentChange: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  previousClose: number | null;
  updatedAt: number;
}

export type AlertDirection = "ABOVE" | "BELOW";
export type AlertStatus = "ACTIVE" | "TRIGGERED";

export interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
  status: AlertStatus;
  triggeredAt: string | null;
  createdAt: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
}

export interface CandlePoint {
  t: number;
  c: number;
}
