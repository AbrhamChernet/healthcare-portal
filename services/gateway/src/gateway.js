import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible dev environment
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('dev'));

// Rate Limiting: 200 requests per 15 mins per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Microservices routing map
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  signaling: process.env.SIGNALING_SERVICE_URL || 'http://localhost:5002',
  ehr: process.env.EHR_SERVICE_URL || 'http://localhost:5003',
  vitals: process.env.VITALS_SERVICE_URL || 'http://localhost:5004'
};

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Telehealth API Gateway',
    timestamp: new Date().toISOString(),
    routes: {
      auth: `${SERVICES.auth}/health`,
      signaling: `${SERVICES.signaling}/health`,
      ehr: `${SERVICES.ehr}/health`,
      vitals: `${SERVICES.vitals}/health`
    }
  });
});

// Proxy routes to Microservices
app.use('/api/auth', createProxyMiddleware({
  target: `${SERVICES.auth}/api/auth`,
  changeOrigin: true
}));

app.use('/api/users', createProxyMiddleware({
  target: `${SERVICES.auth}/api/users`,
  changeOrigin: true
}));

app.use('/api/consultations', createProxyMiddleware({
  target: `${SERVICES.signaling}/api/consultations`,
  changeOrigin: true,
  ws: true // Support WebSockets if upgraded
}));

app.use('/api/ehr', createProxyMiddleware({
  target: `${SERVICES.ehr}/api/ehr`,
  changeOrigin: true
}));

app.use('/api/vitals', createProxyMiddleware({
  target: `${SERVICES.vitals}/api/vitals`,
  changeOrigin: true,
  ws: true
}));

// Fallback for unmapped routes
app.use((req, res) => {
  res.status(404).json({ error: `Gateway cannot route ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`[API-GATEWAY] Running on port ${PORT}`);
  console.log(`[API-GATEWAY] Routing /api/auth -> ${SERVICES.auth}`);
  console.log(`[API-GATEWAY] Routing /api/consultations -> ${SERVICES.signaling}`);
  console.log(`[API-GATEWAY] Routing /api/ehr -> ${SERVICES.ehr}`);
  console.log(`[API-GATEWAY] Routing /api/vitals -> ${SERVICES.vitals}`);
});
