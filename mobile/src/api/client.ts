import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../config";
import { Alert, AlertDirection, Stock, User, CandlePoint } from "../types";

const TOKEN_KEY = "auth.token";

let authToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  authToken = await AsyncStorage.getItem(TOKEN_KEY);
  return authToken;
}

export async function setToken(token: string | null) {
  authToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return authToken;
}

const api: AxiosInstance = axios.create({
  baseURL: `${config.apiBaseUrl}/api`,
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  if (authToken) cfg.headers.Authorization = `Bearer ${authToken}`;
  return cfg;
});

// Normalises backend error envelopes into Error(message).
function unwrapError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error?.message ?? err.message;
    throw new Error(msg);
  }
  throw err as Error;
}

// --- Auth ---
export async function login(email: string, password: string) {
  try {
    const { data } = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    return data;
  } catch (e) {
    unwrapError(e);
  }
}

export async function register(email: string, password: string) {
  try {
    const { data } = await api.post<{ token: string; user: User }>("/auth/register", {
      email,
      password,
    });
    return data;
  } catch (e) {
    unwrapError(e);
  }
}

// --- Stocks ---
export async function fetchStocks(): Promise<Stock[]> {
  try {
    const { data } = await api.get<{ stocks: Stock[] }>("/stocks");
    return data.stocks;
  } catch (e) {
    unwrapError(e);
  }
}

export async function fetchHistory(symbol: string): Promise<CandlePoint[]> {
  try {
    const { data } = await api.get<{ history: CandlePoint[] }>(
      `/stocks/${symbol}/history`
    );
    return data.history;
  } catch (e) {
    unwrapError(e);
  }
}

// --- Alerts ---
export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const { data } = await api.get<{ alerts: Alert[] }>("/alerts");
    return data.alerts;
  } catch (e) {
    unwrapError(e);
  }
}

export async function createAlert(input: {
  symbol: string;
  targetPrice: number;
  direction: AlertDirection;
}): Promise<Alert> {
  try {
    const { data } = await api.post<{ alert: Alert }>("/alerts", input);
    return data.alert;
  } catch (e) {
    unwrapError(e);
  }
}

export async function deleteAlert(id: string): Promise<void> {
  try {
    await api.delete(`/alerts/${id}`);
  } catch (e) {
    unwrapError(e);
  }
}

export async function resetAlert(id: string): Promise<Alert> {
  try {
    const { data } = await api.post<{ alert: Alert }>(`/alerts/${id}/reset`);
    return data.alert;
  } catch (e) {
    unwrapError(e);
  }
}

// --- Devices (FCM token registration) ---
export async function registerDevice(token: string, platform = "android") {
  try {
    await api.post("/devices", { token, platform });
  } catch (e) {
    unwrapError(e);
  }
}
