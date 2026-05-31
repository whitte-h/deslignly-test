const express = require('express');
const { Alert } = require('../models');
const authenticate = require('../middleware/auth');
const { subscribe } = require('../services/finnhubService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { symbol, targetPrice } = req.body;
    if (!symbol || !targetPrice) {
      return res.status(400).json({ error: 'symbol and targetPrice are required' });
    }
    const alert = await Alert.create({
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      userId: req.user.id,
    });
    // Ensure we're subscribed to real-time data for this symbol
    subscribe(symbol.toUpperCase());
    res.status(201).json({ alert });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    const { targetPrice, active } = req.body;
    await alert.update({
      ...(targetPrice !== undefined && { targetPrice: parseFloat(targetPrice) }),
      ...(active !== undefined && { active, triggered: active ? false : alert.triggered }),
    });
    res.json({ alert });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Alert.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
