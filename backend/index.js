require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cropsRouter = require('./routes/crops');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mandi-Connect API is running' });
});

// Routes
app.use('/api/crops', cropsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);

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
