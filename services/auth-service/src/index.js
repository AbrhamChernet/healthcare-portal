import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_auth';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Auth & Identity Microservice',
    mongoConnection: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Connect to MongoDB & Start Server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`[AUTH-SERVICE] Connected to MongoDB at ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[AUTH-SERVICE] Listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[AUTH-SERVICE] MongoDB Connection Error:', err);
    // Still listen so errors can be surfaced via health check
    app.listen(PORT, () => {
      console.log(`[AUTH-SERVICE] Listening in degraded state (No DB) on port ${PORT}`);
    });
  });
