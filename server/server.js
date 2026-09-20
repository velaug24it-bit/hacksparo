require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDBStatus } = require('./config/db');
const resourceRoutes = require('./routes/resourceRequest.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database (MongoDB with automatic in-memory fallback)
connectDB();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permissive CORS for any localhost/127.0.0.1 port (5173, 5174, etc.) or network IP
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json());

// Request logger for observability
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Welcome & API Status at Root
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CrisisCare Mesh Disaster Management Backend API is live!',
    status: 'ONLINE',
    database: getDBStatus(),
    endpoints: {
      health: '/api/health',
      resourceRequests: '/api/resource-requests',
      foodBridgeDonors: '/api/foodbridge/donors',
      offlineMeshPackets: '/api/mesh/packets',
      crisisMapLocations: '/api/map/locations'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check & System Info
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'CrisisCare Mesh Platform API',
    database: getDBStatus(),
    timestamp: new Date().toISOString()
  });
});

const meshRoutes = require('./routes/mesh.routes');

// Mount Routes
app.use('/api', resourceRoutes);
app.use('/api', meshRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint "${req.originalUrl}" not found.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CrisisCare Mesh — Yellow Resource SOS Server`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = { app, server };
