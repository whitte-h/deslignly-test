require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const alertRoutes = require('./routes/alerts');
const { initFinnhubWebSocket } = require('./services/finnhubService');
const { checkAlerts } = require('./services/alertService');

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
  socket.on('disconnect', () =>
    console.log(`[Socket.io] Client disconnected: ${socket.id}`)
  );
});

// Connect to Finnhub WebSocket, emit updates to Socket.io clients, and check alerts
initFinnhubWebSocket(io, checkAlerts);

const PORT = parseInt(process.env.PORT || '3000');

async function seedDemoUser() {
  const { User } = require('./models');
  const exists = await User.findOne({ where: { email: 'demo@stockalert.com' } });
  if (!exists) {
    await User.create({ username: 'demo', email: 'demo@stockalert.com', password: 'demo1234' });
    console.log('[Seed] Demo user created: demo@stockalert.com / demo1234');
  }
}

sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log('[DB] Models synchronized');
    await seedDemoUser();
    server.listen(PORT, '0.0.0.0', () =>
      console.log(`[Server] Running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('[DB] Sync failed:', err.message);
    process.exit(1);
  });
