require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const _log = console.log;
console.log = () => {};
console.info = () => {};
console.warn = () => {};
global.serverLog = _log;

const cropsRouter = require('./routes/crops');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const aiRouter = require('./routes/ai');
const chatRouter = require('./routes/chat');
const authRouter = require('./routes/auth');
const spoilageRouter = require('./routes/spoilage');
const otpRouter = require('./routes/otp');
const notificationsRouter = require('./routes/notifications');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: [
    'https://agri-mitra-alpha.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request timing middleware — logs how long each API call takes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - start;
      const symbol = duration > 3000 ? '🐢' : '⚠️';
      console.error(`${symbol} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mandi-Connect API is running' });
});

// Routes
app.use('/api/crops', cropsRouter);
app.use('/api/orders', authMiddleware, ordersRouter);
app.use('/api/payments', authMiddleware, paymentsRouter);
app.use('/api/ai', authMiddleware, aiRouter);
app.use('/api/chat', chatRouter);
app.use('/api/auth', authRouter);
app.use('/api/spoilage', spoilageRouter);
app.use('/api/otp', otpRouter);
app.use('/api/notifications', authMiddleware, notificationsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  global.serverLog(`Mandi-Connect server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`Please close any existing processes on this port or change the PORT in backend/.env to something else (e.g., 3002).\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
