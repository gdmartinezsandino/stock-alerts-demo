# Backend — Stock Alerts API

Node 20 · Express · TypeScript · Prisma · PostgreSQL · Socket.IO · Finnhub · FCM.

## Run it

```bash
cp .env.example .env     # set FINNHUB_API_KEY at minimum
docker compose up -d db  # Postgres on :5432
npm install
npx prisma migrate dev   # apply schema
npm run seed             # demo@designli.co / password123
npm run dev              # http://localhost:4000
```

Or run the whole stack (API + DB) in Docker: `docker compose up --build`.

## Environment variables

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `JWT_SECRET` | ✅ | Signing secret for auth tokens |
| `JWT_EXPIRES_IN` | | Token TTL, default `7d` |
| `FINNHUB_API_KEY` | ✅ | Free key from finnhub.io |
| `TRACKED_SYMBOLS` | | CSV; default `AAPL,MSFT,GOOGL,AMZN,TSLA,META,NVDA,NFLX` |
| `FIREBASE_CREDENTIALS_PATH` | | Path to service-account JSON. Empty → FCM dry-run (logs only) |
| `PORT` | | Default `4000` |

## Project structure

```
src/
├── index.ts              app bootstrap: DB, FCM, Socket.IO, price feed, alert engine
├── app.ts                Express app (middleware + routes)
├── config/               env loading, Prisma client
├── routes/index.ts       all REST routes
├── controllers/          request handlers (auth, alerts, stocks, devices)
├── middleware/           requireAuth (JWT), errorHandler (+ asyncHandler)
├── services/
│   ├── finnhubRest.ts    REST quote / profile / history
│   ├── finnhubSocket.ts  resilient Finnhub WebSocket client (auto-reconnect)
│   ├── priceFeed.ts      unified feed: WS live + REST polling fallback
│   ├── alertEngine.ts    evaluates alerts against the feed → triggers FCM
│   └── fcm.ts            firebase-admin push (dry-run without credentials)
├── sockets/io.ts         Socket.IO server: JWT handshake + price broadcast
└── utils/                jwt, logger, errors, zod validation
prisma/
├── schema.prisma         User, DeviceToken, Alert
└── seed.ts               demo user + sample alerts
```

## REST API

All `/api` routes except `health`, `auth/login`, `auth/register` require
`Authorization: Bearer <token>`.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Liveness probe |
| POST | `/api/auth/register` | `{email,password}` | Create account → `{token,user}` |
| POST | `/api/auth/login` | `{email,password}` | Log in → `{token,user}` |
| GET | `/api/auth/me` | — | Current user from token |
| GET | `/api/stocks` | — | Tracked universe + latest quotes |
| GET | `/api/stocks/:symbol` | — | Quote + profile + history |
| GET | `/api/stocks/:symbol/history` | — | Chart history points |
| GET | `/api/alerts` | — | Current user's alerts |
| POST | `/api/alerts` | `{symbol,targetPrice,direction}` | Create alert |
| DELETE | `/api/alerts/:id` | — | Delete alert |
| POST | `/api/alerts/:id/reset` | — | Re-arm a triggered alert |
| POST | `/api/devices` | `{token,platform}` | Register FCM device token |
| DELETE | `/api/devices` | `{token}` | Unregister token |

`direction` is `ABOVE` (notify when `price ≥ target`) or `BELOW`
(`price ≤ target`).

## Realtime (Socket.IO)

Connect to the same origin with `auth: { token }`.

- Server → client `snapshot`: `PriceUpdate[]` sent once on connect.
- Server → client `price`: `{ symbol, price, timestamp, volume? }` per tick.

## How alerts fire (FCM)

1. `priceFeed` emits a price for a symbol.
2. `alertEngine` loads `ACTIVE` alerts for that symbol and checks the condition.
3. On a match it atomically flips the alert to `TRIGGERED` (so it only fires
   once), then calls `fcm.sendPush` to every device token of the alert's owner.
4. Invalid/expired tokens returned by FCM are pruned from the DB automatically.

To enable real pushes, download a Firebase **service-account** JSON and set
`FIREBASE_CREDENTIALS_PATH` to it (and mount it in `docker-compose.yml`).

## Notes on Finnhub

- The free tier streams trades over WebSocket **only during US market hours**.
  `priceFeed` therefore also polls REST quotes every ~8s and emits them when the
  socket is quiet, so the demo works around the clock.
- The free `/stock/candle` endpoint is often restricted, so chart history is
  synthesised from the daily quote (prevClose→open→low→high→current). Swap
  `getQuoteHistory` in `finnhubRest.ts` for a real candle call on a paid key.

## Docker

`docker-compose.yml` defines `db` (Postgres 16) and `api` (this service). The
API image runs `prisma migrate deploy` on start, then `node dist/index.js`.
Pass secrets via the environment, e.g.:

```bash
FINNHUB_API_KEY=xxx JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```
