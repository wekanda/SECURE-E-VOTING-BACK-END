const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const electionsRoutes = require('./routes/elections');
const positionsRoutes = require('./routes/positions');
const candidatesRoutes = require('./routes/candidates');
const verificationRoutes = require('./routes/verification');
const votingRoutes = require('./routes/voting');
const reportsRoutes = require('./routes/reports');
const votersRoutes = require('./routes/voters');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/positions', positionsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/voters', votersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;