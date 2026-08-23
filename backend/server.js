require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React app and mobile emulator can request resources
app.use(cors());

// Parse JSON request payloads
app.use(express.json());

// Database initial connection
connectDB();

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Bind API routes under '/api' prefix
app.use('/api', apiRoutes);

// General route catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`FoodFreshness backend server running on port ${PORT}`);
});
