import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Check MongoDB connection
const checkDatabase = () => {
  const readyState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState !== 1) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    throw new Error(`Database not connected (state: ${states[readyState] || readyState}). Please check your MongoDB connection.`);
  }
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    checkDatabase();
    
    const { email, password, name, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ email, password, name, company });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.message.includes('Database not connected')) {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check your MongoDB connection.',
        details: 'Make sure MongoDB is running or configure MongoDB Atlas in your .env file'
      });
    }
    res.status(500).json({ error: error.message || 'An error occurred during signup' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    checkDatabase();
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message.includes('Database not connected')) {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please check your MongoDB connection.',
        details: 'Make sure MongoDB is running or configure MongoDB Atlas in your .env file'
      });
    }
    res.status(500).json({ error: error.message || 'An error occurred during login' });
  }
});

export default router;

