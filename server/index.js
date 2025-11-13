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

// MongoDB connection handler - optimized for serverless
let cachedConnection = null;

async function connectDB() {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return mongoose.connection;
  }

  // Return cached connection if exists and is connecting
  if (cachedConnection && mongoose.connection.readyState === 2) {
    console.log('⏳ MongoDB connection in progress...');
    return cachedConnection;
  }

  try {
    // Connection options optimized for serverless
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    };

    console.log('🔄 Connecting to MongoDB...');
    cachedConnection = await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ Connected to MongoDB');
    const maskedURI = MONGODB_URI.replace(/\/\/.*@/, '//***@');
    console.log(`   Database: ${maskedURI}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      cachedConnection = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      cachedConnection = null;
    });

    return cachedConnection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    cachedConnection = null;
    
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

// Connect to MongoDB (non-blocking for serverless)
if (!isVercel) {
  connectDB().catch(console.error);
}

// Middleware to ensure DB connection for API routes (serverless-friendly)
app.use('/api', async (req, res, next) => {
  // Skip health check - it handles its own connection
  if (req.path === '/health') {
    return next();
  }
  
  try {
    // Ensure DB is connected before handling request
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection failed in middleware:', error.message);
    res.status(503).json({ 
      error: 'Database connection failed',
      message: 'Please try again in a moment'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({ 
      status: 'ok', 
      message: 'Vocalent API is running',
      database: states[dbState] || 'unknown',
      readyState: dbState
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      database: 'disconnected',
      error: error.message
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

