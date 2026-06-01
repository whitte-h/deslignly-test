import WebSocket from 'ws';
import axios from 'axios';

const API_KEY = process.env.FINNHUB_API_KEY;
const WS_URL = `wss://ws.finnhub.io?token=${API_KEY}`;
const REST_URL = 'https://finnhub.io/api/v1';

export const DEFAULT_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META',
  'TSLA', 'NVDA', 'NFLX', 'AMD', 'INTC',
];

// In-memory price cache { symbol: { price, timestamp } }
export const latestPrices = {};

let ws;
let ioServer;
const subscribedSymbols = new Set();
let checkAlertsCallback = null;

// Hoisted before initFinnhubWebSocket so no-use-before-define is satisfied
const subscribeInternal = (symbol) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', symbol }));
  }
};

const connect = () => {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('[Finnhub] WebSocket connected');
    DEFAULT_SYMBOLS.forEach((s) => subscribeInternal(s));
    subscribedSymbols.forEach((s) => subscribeInternal(s));
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'trade' && Array.isArray(msg.data)) {
        msg.data.forEach(({ s: symbol, p: price, t: ts }) => {
          latestPrices[symbol] = { price, timestamp: ts };
          if (ioServer) ioServer.emit('price_update', { symbol, price, timestamp: ts });
          if (checkAlertsCallback) checkAlertsCallback(symbol, price);
        });
      }
    } catch {
      // ignore malformed messages
    }
  });

  ws.on('error', (err) => console.error('[Finnhub] WS error:', err.message));

  ws.on('close', () => {
    console.log('[Finnhub] WS closed — reconnecting in 5s');
    setTimeout(connect, 5000);
  });

  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  return heartbeat;
};

export const initFinnhubWebSocket = (io, onPrice) => {
  ioServer = io;
  checkAlertsCallback = onPrice;
  connect();
};

export const subscribe = (symbol) => {
  subscribedSymbols.add(symbol);
  subscribeInternal(symbol);
};

export const getQuote = async (symbol) => {
  const { data } = await axios.get(`${REST_URL}/quote`, {
    params: { symbol, token: API_KEY },
  });
  return data;
};

export const searchSymbols = async (query) => {
  const { data } = await axios.get(`${REST_URL}/search`, {
    params: { q: query, token: API_KEY },
  });
  return data;
};

export const getCandles = async (symbol, resolution, from, to) => {
  const { data } = await axios.get(`${REST_URL}/stock/candle`, {
    params: {
      symbol, resolution, from, to, token: API_KEY,
    },
  });
  return data;
};
