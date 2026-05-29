import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// A comma-separated list of stock symbols the backend tracks live via Finnhub.
const DEFAULT_SYMBOLS = "AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: required("JWT_SECRET", "dev-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  finnhubApiKey: required("FINNHUB_API_KEY"),
  finnhubWsUrl: "wss://ws.finnhub.io",
  finnhubRestUrl: "https://finnhub.io/api/v1",

  // Symbols tracked for the live list/chart and used as the alert universe.
  trackedSymbols: (process.env.TRACKED_SYMBOLS ?? DEFAULT_SYMBOLS)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean),

  // Path to the Firebase service-account JSON. If absent, FCM pushes are
  // logged instead of sent so the rest of the app still runs.
  firebaseCredentialsPath: process.env.FIREBASE_CREDENTIALS_PATH ?? "",
};

export type Env = typeof env;
