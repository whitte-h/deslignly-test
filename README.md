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

### 1 — Backend (Docker, recommended)

```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET and Firebase credentials

docker-compose up --build
```

The API will be available at `http://localhost:3000`.

### 1b — Backend (local, without Docker)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set DB_HOST=localhost and credentials

npm run dev
```

Requires a running PostgreSQL instance.

### 2 — Mobile App

```bash
cd mobile
npm install
```

Edit `src/api/index.js` and update `BASE_URL` to point to your backend:

```js
export const BASE_URL = 'http://<YOUR_LOCAL_IP>:3000';
```

> Use your machine's local IP (not `localhost`) when testing on a physical device.

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app, or press `i` / `a` for a simulator.

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
| Docker deployment | PostgreSQL + backend via docker-compose |

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
