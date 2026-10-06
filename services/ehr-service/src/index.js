import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ehrRoutes from './routes/ehrRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/telehealth_ehr';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/ehr', ehrRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'EHR & Clinical Records Service',
    encryption: 'AES-256-GCM',
    auditChaining: 'SHA-256 Hash Chain Active',
    mongoConnection: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString()
  });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`[EHR-SERVICE] Connected to MongoDB at ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[EHR-SERVICE] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[EHR-SERVICE] MongoDB error:', err);
    app.listen(PORT, () => {
      console.log(`[EHR-SERVICE] Running in degraded state (No DB) on port ${PORT}`);
    });
  });
