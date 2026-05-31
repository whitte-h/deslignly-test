const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }
    const user = await User.create({ username, email, password });
    res.status(201).json({ token: signToken(user.id), user: safeUser(user) });
  } catch (err) {
    const isDuplicate = err.name === 'SequelizeUniqueConstraintError';
    res.status(isDuplicate ? 409 : 400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ token: signToken(user.id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/fcm-token', authenticate, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken is required' });
    await req.user.update({ fcmToken });
    res.json({ message: 'FCM token updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

module.exports = router;
