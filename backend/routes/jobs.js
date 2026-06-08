import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

const router = express.Router();

// Get all open jobs for the public application page
router.get('/public', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all jobs for the logged-in recruiter
router.get('/', authenticate, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new job
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, department, description } = req.body;
    
    const user = await User.findById(req.userId);
    
    const job = new Job({
      title,
      department,
      description,
      company: user.company || '',
      recruiterId: req.userId,
    });
    
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a job
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, department, description, status } = req.body;
    
    const job = await Job.findOne({ _id: req.params.id, recruiterId: req.userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (title) job.title = title;
    if (department) job.department = department;
    if (description !== undefined) job.description = description;
    if (status) job.status = status;
    
    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiterId: req.userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
