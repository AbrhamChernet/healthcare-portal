import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import consultationRoutes from './routes/consultationRoutes.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';
import { registerSignalingHandlers } from './sockets/signalingHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_consultations';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Mount REST routes
app.use('/api/consultations', consultationRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'WebRTC Signaling & Consultation Service',
    mongoConnection: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString()
  });
});

// Configure Socket.io with JWT authentication
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use(socketAuthMiddleware);
registerSignalingHandlers(io);

// Connect to MongoDB and Start Server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`[SIGNALING-SERVICE] Connected to MongoDB at ${MONGO_URI}`);
    server.listen(PORT, () => {
      console.log(`[SIGNALING-SERVICE] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[SIGNALING-SERVICE] MongoDB error:', err);
    server.listen(PORT, () => {
      console.log(`[SIGNALING-SERVICE] Running in degraded state (No DB) on port ${PORT}`);
    });
  });
