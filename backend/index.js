require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');

const cropsRouter = require('./routes/crops');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const aiRouter = require('./routes/ai');
const chatRouter = require('./routes/chat');
const otpRouter = require('./routes/otp');
const authRouter = require('./routes/auth');

const app = express();
let PORT = process.env.PORT || 3002;
if (PORT == 3000) PORT = 3002; // Avoid Vite conflict if PORT=3000 is inherited from env

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request timing middleware — logs how long each API call takes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const symbol = duration > 3000 ? '🐢' : duration > 1000 ? '⚠️' : '⚡';
    console.log(`${symbol} ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mandi-Connect API is running' });
});

// Routes
app.use('/api/crops', cropsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/chat', chatRouter);
app.use('/api/otp', otpRouter);
app.use('/api/auth', authRouter);

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
  console.log(`Mandi-Connect server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`Please close any existing processes on this port or change the PORT in backend/.env to something else (e.g., 3002).\n`);
    process.exit(1);
  } else {
    throw err;
  }
});
