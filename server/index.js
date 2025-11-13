import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidates.js';
import interviewRoutes from './routes/interviews.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = process.env.VERCEL === '1';

// Middleware
// CORS configuration - allow requests from Vercel deployment and localhost
// On Vercel, frontend and API are on the same domain, so CORS is less critical
const corsOptions = {
  origin: process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',')
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : true, // Allow all origins in development
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalent';

// MongoDB connection handler
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (!isVercel) {
      console.error('\n📋 To fix this:');
      console.error('   1. Make sure MongoDB is installed and running');
      console.error('   2. Or use MongoDB Atlas (cloud) and update MONGODB_URI in .env');
      console.error('   3. For local MongoDB, run: mongod (or start MongoDB service)');
      console.error('\n⚠️  Server cannot start without database connection.\n');
      process.exit(1);
    }
    throw err;
  }
}

// Connect to MongoDB
connectDB().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ 
      status: 'ok', 
      message: 'Vocalent API is running',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      database: 'disconnected'
    });
  }
});

// Start server only in local development (not on Vercel)
if (!isVercel) {
  mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
}

// Export app for Vercel serverless functions
export default app;

