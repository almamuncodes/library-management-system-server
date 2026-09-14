require('dotenv').config();
const dns = require('node:dns');
// Ensure Atlas SRV resolution works reliably on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/stats', statsRoutes);

// Root & Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'MongoDB Disconnected',
  });
});

app.get('/', (req, res) => {
  res.send('📚 Library Management Backend API is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Library Server running on http://localhost:${PORT}`);
  console.log(`📡 MongoDB Books API: http://localhost:${PORT}/api/books`);
  console.log(`📡 MongoDB Stats API: http://localhost:${PORT}/api/stats`);
});
