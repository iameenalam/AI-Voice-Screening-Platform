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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalent';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log(`   Database: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('\n📋 To fix this:');
  console.error('   1. Make sure MongoDB is installed and running');
  console.error('   2. Or use MongoDB Atlas (cloud) and update MONGODB_URI in .env');
  console.error('   3. For local MongoDB, run: mongod (or start MongoDB service)');
  console.error('\n⚠️  Server will continue but database features will not work.\n');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vocalent API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

