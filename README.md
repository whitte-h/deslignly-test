# StockAlert — Full-Stack Real-Time Stock App

React Native (Expo) mobile app + Node.js backend with real-time Finnhub stock data, price alerts, and Firebase Cloud Messaging push notifications.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React Native App (Expo)                                    │
│  ├── Auth screens (Login / Register)                        │
│  ├── Stocks screen (real-time prices + performance chart)   │
│  ├── Stock Detail screen (historical line chart)            │
│  ├── Alerts screen (list, pause, delete)                    │
│  └── Create Alert screen (symbol search + target price)     │
└──────────────────┬──────────────────────────────────────────┘
                   │  REST (axios) + WebSocket (socket.io-client)
                   │  Push notifications (FCM via expo-notifications)
┌──────────────────▼──────────────────────────────────────────┐
│  Node.js / Express Backend                                  │
│  ├── POST /api/auth/register|login                          │
│  ├── GET  /api/stocks        — list with live prices        │
│  ├── GET  /api/stocks/:sym/candles — chart data             │
│  ├── CRUD /api/alerts                                       │
│  ├── Socket.io  — broadcasts price_update events           │
│  ├── Finnhub WebSocket client — live trade feed            │
│  └── Firebase Admin SDK — FCM push on alert trigger        │
└──────────────────┬──────────────────────────────────────────┘
          ┌────────┴────────┐
          │                 │
  ┌───────▼──────┐  ┌───────▼──────────┐
  │  PostgreSQL  │  │  Finnhub API      │
  │  (via Docker)│  │  wss://ws.finnhub │
  └──────────────┘  └──────────────────┘
```

---

## Quick Start

The recommended dev setup is **PostgreSQL in Docker + backend running locally with Node**. This keeps the database isolated while letting you iterate on the backend with hot-reload and full access to local tooling.

### 1 — Start PostgreSQL (Docker)

```bash
cd backend
docker compose up -d
```

This starts only the `db` service (Postgres 16 on port 5432) with a persistent `pgdata` volume. No backend container is involved.

### 2 — Start the backend (Node)

```bash
cd backend
cp .env.example .env   # first time only
# Edit .env — set JWT_SECRET and Firebase credentials if needed

npm install
npm run dev            # or: node src/app.js
```

The API will be available at `http://localhost:3000`. On first run Sequelize syncs the schema and seeds a demo user automatically.

> **Demo credentials:** `demo@stockalert.com` / `demo1234`

### 3 — Start the mobile app

```bash
cd mobile
npm install
npx expo start --clear
```

Scan the QR code with **Expo Go**, or press `i` / `a` for a simulator.

The app auto-detects your machine's LAN IP from Expo's Metro host, so **no manual IP configuration is needed** — it works on both simulator and physical device out of the box.

### Stopping Postgres

```bash
cd backend
docker compose down          # stop (data is preserved)
docker compose down -v       # stop and delete the database volume
```

---

## Firebase Cloud Messaging Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Add an Android/iOS app to your Firebase project.
3. Download `google-services.json` (Android) → place at `mobile/google-services.json`.
4. Go to **Project Settings → Service Accounts → Generate New Private Key**.
5. Copy the JSON values into your backend `.env`:
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
   ```

For production builds with push notifications, use [EAS Build](https://docs.expo.dev/build/introduction/).

---

## Features

| Feature | Implementation |
|---|---|
| User login / register | JWT auth, bcrypt password hashing |
| Real-time stock prices | Finnhub WebSocket → Socket.io broadcast |
| Performance chart (all stocks) | LineChart showing today's % change |
| Individual stock chart | Finnhub candle API, 1W/1M/3M/1Y ranges |
| Price alerts (create, pause, delete) | PostgreSQL + Sequelize ORM |
| FCM push notification | Firebase Admin SDK on server, expo-notifications on mobile |
| Docker deployment | PostgreSQL via docker-compose, backend runs locally with Node |

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | Current user profile |
| PUT | `/api/auth/fcm-token` | ✓ | Store FCM device token |
| GET | `/api/stocks` | ✓ | List stocks with prices |
| GET | `/api/stocks/search?q=` | ✓ | Search Finnhub symbols |
| GET | `/api/stocks/:symbol/quote` | ✓ | Single stock quote |
| GET | `/api/stocks/:symbol/candles` | ✓ | OHLCV candle data |
| GET | `/api/alerts` | ✓ | User's alerts |
| POST | `/api/alerts` | ✓ | Create price alert |
| PUT | `/api/alerts/:id` | ✓ | Update alert (pause/resume) |
| DELETE | `/api/alerts/:id` | ✓ | Delete alert |

### Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `price_update` | server → client | `{ symbol, price, timestamp }` |

---

## Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockapp
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=<long-random-string>
FINNHUB_API_KEY=d7k6v81r01qn1u2gf6l0d7k6v81r01qn1u2gf6lg
FIREBASE_PROJECT_ID=<from-firebase-console>
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_PRIVATE_KEY=<from-service-account-json>
```

---

## Tech Stack

**Backend:** Node.js, Express, Socket.io, Sequelize (PostgreSQL), Finnhub WebSocket, Firebase Admin SDK, JWT, bcryptjs, Docker

**Mobile:** React Native, Expo, React Navigation, react-native-chart-kit, socket.io-client, expo-notifications, AsyncStorage
