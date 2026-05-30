# Stock Alerts — React Native + Node Full-Stack

A full-stack application that streams **real-time stock prices** from the
[Finnhub](https://finnhub.io) APIs, lets users create **price alerts**, and
pushes a **Firebase Cloud Messaging** notification the moment a stock crosses a
target price.

Built for the Designli *React Native + Node Developer* code test.

| Layer | Stack |
|-------|-------|
| Mobile | Expo (dev build) · React Native 0.76 · TypeScript · React Navigation · Socket.IO client · React Native Firebase (FCM) |
| Backend | Node 20 · Express · TypeScript · Prisma · PostgreSQL · Socket.IO · `ws` (Finnhub stream) · firebase-admin |
| Infra | Docker + docker-compose (API + Postgres) |

---

## ✅ Requirements coverage

| # | Functional requirement | Where it lives |
|---|------------------------|----------------|
| 1 | **Users can log in** | JWT auth — [`backend/src/controllers/authController.ts`](backend/src/controllers/authController.ts), [`mobile/src/screens/LoginScreen.tsx`](mobile/src/screens/LoginScreen.tsx) |
| 2 | **Form to create a stock price alert** | [`mobile/src/screens/CreateAlertScreen.tsx`](mobile/src/screens/CreateAlertScreen.tsx) → `POST /api/alerts` |
| 3 | **List of stocks** (live) | [`mobile/src/screens/StocksScreen.tsx`](mobile/src/screens/StocksScreen.tsx) + Socket.IO live ticks |
| 4 | **Graphic of all stocks** | [`mobile/src/screens/ChartsScreen.tsx`](mobile/src/screens/ChartsScreen.tsx) + per-stock detail chart |
| 5 | **FCM notification when price > alert** | [`backend/src/services/alertEngine.ts`](backend/src/services/alertEngine.ts) + [`backend/src/services/fcm.ts`](backend/src/services/fcm.ts) |
| ⭐ | **Docker for deployment** | [`backend/Dockerfile`](backend/Dockerfile) + [`backend/docker-compose.yml`](backend/docker-compose.yml) |

---

## 🏗 Architecture

```
                    Finnhub
            ┌───────────┴───────────┐
            │ WebSocket (live trades)│ REST (quote / history)
            ▼                       ▼
  ┌───────────────────────────────────────────┐
  │                 Node backend               │
  │                                            │
  │  priceFeed  ──emits──►  Socket.IO  ───────────► 📱 live list & charts
  │     │                                      │
  │     └──emits──►  alertEngine ──► firebase-admin ─► FCM ─► 📱 push
  │                                            │
  │  Express REST  ◄──── Prisma ──── PostgreSQL│
  │  (auth, alerts, stocks, devices)           │
  └───────────────────────────────────────────┘
```

- **`priceFeed`** is the single source of price truth. It prefers the Finnhub
  **WebSocket** (real-time trades) and falls back to **REST polling** when the
  market is closed, so the UI and alerts keep working at any hour.
- **Socket.IO** relays every tick to authenticated mobile clients → the list and
  charts update live without polling.
- **`alertEngine`** listens to the same feed and fires an FCM push exactly once
  per alert (idempotent via a `TRIGGERED` status transition).

See [`backend/README.md`](backend/README.md) and [`mobile/README.md`](mobile/README.md) for module-level detail.

---

## 🚀 Quick start

### 0. Prerequisites
- Node 20+, Docker, and a free **Finnhub API key** (<https://finnhub.io/dashboard>).
- For mobile: Android Studio / a device, and the Expo CLI (`npx expo`).
- (For real push) a **Firebase project** with Cloud Messaging enabled.

### 1. Backend

```bash
cd backend
cp .env.example .env          # then set FINNHUB_API_KEY (and JWT_SECRET)

# Option A — everything in Docker (API + Postgres):
docker compose up --build

# Option B — Postgres in Docker, API on the host (nice for development):
docker compose up -d db
npm install
npx prisma migrate dev        # creates tables
npm run seed                  # demo@designli.co / password123
npm run dev
```

API is now on `http://localhost:4000`. Health check: `GET /api/health`.

### 2. Mobile

```bash
cd mobile
npm install

# Put your Firebase Android config here (see mobile/README.md):
#   mobile/google-services.json

# FCM needs a *dev build*, not Expo Go:
npx expo run:android          # builds & installs the dev client on a device/emulator
```

Point the app at your machine in [`mobile/app.json`](mobile/app.json) → `extra.apiBaseUrl`:
- Android emulator → `http://10.0.2.2:4000` (default)
- Physical device → `http://<your-LAN-IP>:4000`

Log in with **demo@designli.co / password123**, or register a new account.

---

## 🔔 Testing the alert → push flow end-to-end

1. Log in on the device (this registers its FCM token with the backend).
2. Create an alert whose target is just **below** the current price with
   direction **ABOVE** (so it triggers on the next tick) — or use **BELOW** with
   a target above the price.
3. When `priceFeed` reports a crossing, the backend sends an FCM push and the
   alert flips to **Triggered**. Background the app to see the system
   notification; in the foreground it renders via `expo-notifications`.

> No Firebase credentials yet? The backend runs FCM in **dry-run** mode and logs
> the push payload instead of sending it, so the rest of the app still works.

---

## 📦 Deliverables checklist (from the brief)

- [x] Public repository (this repo)
- [x] Detailed documentation (this file + per-package READMEs)
- [x] Docker for backend deployment (extra points)
- [ ] 4-minute demo video (record `npx expo run:android` + alert firing)
- [ ] Android build uploaded to WeTransfer — see [`mobile/README.md`](mobile/README.md#android-build-apk) for the `eas build` / `gradlew assembleRelease` steps

---

## 🗂 Repo layout

```
.
├── backend/        Node + Express + Prisma API, Finnhub + FCM, Docker
├── mobile/         Expo React Native app
└── README.md       you are here
```
