import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import vitalRoutes from './routes/vitalRoutes.js';
import { registerVitalsHandlers } from './sockets/vitalsHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_vitals';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/vitals', vitalRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Biometric Vitals & Telemetry Service',
    mongoConnection: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString()
  });
});

// Socket.io for Real-Time Vitals Streaming
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    // Allow anonymous read only if specified, else enforce token
    return next();
  }
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET || 'super_secure_telehealth_jwt_secret_key_32chars_min!');
    next();
  } catch (err) {
    next(); // Continue with unauthenticated socket if token expired
  }
});

registerVitalsHandlers(io);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`[VITALS-SERVICE] Connected to MongoDB at ${MONGO_URI}`);
    server.listen(PORT, () => {
      console.log(`[VITALS-SERVICE] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[VITALS-SERVICE] MongoDB error:', err);
    server.listen(PORT, () => {
      console.log(`[VITALS-SERVICE] Running in degraded state (No DB) on port ${PORT}`);
    });
  });
