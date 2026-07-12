import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import interviewRoutes from './routes/interviews.js';
import dashboardRoutes from './routes/dashboard.js';
import jobRoutes from './routes/jobs.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing.js";
import { getAIUsageTotals } from "./utils/ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the reverse proxy / load balancer in front of the app so req.ip is the
// real client (derived from X-Forwarded-For against this hop count) rather than
// a client-spoofable header. Rate limiting keys on req.ip, so this must be set
// correctly for it to be effective. Defaults to 1 (single proxy); override with
// TRUST_PROXY (a hop count like "2", or a value such as "loopback"). Numeric
// strings are passed as numbers.
const trustProxy = process.env.TRUST_PROXY ?? '1';
app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

const corsOptions = {
  origin: (origin, callback) => {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
      : ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NOTE: the local `uploads/` directory only holds transient temp files during
// CV parsing (they are deleted immediately after). Permanent CVs live on the
// upload provider (absolute URLs), so this directory is intentionally NOT
// served publicly — doing so exposed temp CVs at predictable URLs.

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalent';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs', jobRoutes);
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
    config: {
      token: process.env.UPLOADTHING_TOKEN,
    }
  })
);

app.get('/api/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    message: 'Vocalent API is running',
    database: states[mongoose.connection.readyState] || 'unknown',
    // Cumulative AI spend is useful in dev/staging but not exposed publicly in
    // production (it reveals usage volume). Per-interview cost lives on the
    // authenticated interview record.
    ...(process.env.NODE_ENV !== 'production' ? { aiUsage: getAIUsageTotals() } : {}),
  });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

export default app;
