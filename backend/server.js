require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React app and mobile emulator can request resources
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-email', 'Authorization'],
  credentials: true
}));

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

// Serve uploaded files temporarily so Groq Vision can fetch them by URL
// Files are deleted by the scan handler immediately after use
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// General route catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`FoodFreshness backend server running on port ${PORT}`);
  console.log(`GROQ_API_KEY status: ${process.env.GROQ_API_KEY ? '✅ configured (' + process.env.GROQ_API_KEY.substring(0, 8) + '...)' : '❌ NOT SET — AI scanner will be unavailable'}`);
});
