import 'dotenv/config';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

import { sequelize, User } from './models/index.js';
import { router as authRoutes } from './routes/auth.js';
import { router as stockRoutes } from './routes/stocks.js';
import { router as alertRoutes } from './routes/alerts.js';
import { initFinnhubWebSocket } from './services/finnhubService.js';
import { checkAlerts } from './services/alertService.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[Socket.io] Client disconnected: ${socket.id}`));
});

// Connect to Finnhub WebSocket, emit updates to Socket.io clients, and check alerts
initFinnhubWebSocket(io, checkAlerts);

const PORT = parseInt(process.env.PORT || '3000', 10);

const seedDemoUser = async () => {
  const exists = await User.findOne({ where: { email: 'demo@stockalert.com' } });
  if (!exists) {
    await User.create({ username: 'demo', email: 'demo@stockalert.com', password: 'demo1234' });
    console.log('[Seed] Demo user created: demo@stockalert.com / demo1234');
  }
};

sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log('[DB] Models synchronized');
    await seedDemoUser();
    server.listen(PORT, '0.0.0.0', () => console.log(`[Server] Running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[DB] Sync failed:', err.message);
    process.exit(1);
  });
