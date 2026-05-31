const express = require('express');
const authenticate = require('../middleware/auth');
const {
  getQuote,
  searchSymbols,
  getCandles,
  latestPrices,
  DEFAULT_SYMBOLS,
} = require('../services/finnhubService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const symbols = req.query.symbols
      ? req.query.symbols.split(',')
      : DEFAULT_SYMBOLS;

    const quotes = await Promise.allSettled(
      symbols.map(async (symbol) => {
        const cached = latestPrices[symbol];
        if (cached && Date.now() - cached.timestamp < 10000) {
          return { symbol, price: cached.price, source: 'ws' };
        }
        const q = await getQuote(symbol);
        return {
          symbol,
          price: q.c,
          open: q.o,
          high: q.h,
          low: q.l,
          previousClose: q.pc,
          change: q.d,
          changePercent: q.dp,
        };
      })
    );

    const result = quotes
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    res.json({ stocks: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
    const data = await searchSymbols(q);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:symbol/quote', authenticate, async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getQuote(symbol.toUpperCase());
    res.json({ symbol: symbol.toUpperCase(), ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:symbol/candles', authenticate, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { resolution = 'D', days = 30 } = req.query;
    const to = Math.floor(Date.now() / 1000);
    const from = to - parseInt(days) * 86400;
    const data = await getCandles(symbol.toUpperCase(), resolution, from, to);
    if (data.s === 'no_data') {
      return res.json({ symbol, candles: [], status: 'no_data' });
    }
    res.json({ symbol, candles: data, status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
