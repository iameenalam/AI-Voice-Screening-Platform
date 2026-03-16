import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Interview from '../models/Interview.js';
import Candidate from '../models/Candidate.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.userId });
    const candidates = await Candidate.find({ recruiterId: req.userId });

    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.status === 'completed').length;
    const inProgressInterviews = interviews.filter(i => i.status === 'in_progress').length;
    
    const completedWithSentiment = interviews.filter(
      i => i.status === 'completed' && i.sentimentScore !== undefined
    );
    const avgSentiment = completedWithSentiment.length > 0
      ? completedWithSentiment.reduce((sum, i) => sum + i.sentimentScore, 0) / completedWithSentiment.length
      : 0;

    // Recent interviews
    const recentInterviews = await Interview.find({ recruiterId: req.userId })
      .populate('candidateId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalInterviews,
        completed: completedInterviews,
        inProgress: inProgressInterviews,
        avgSentiment: parseFloat(avgSentiment.toFixed(2)),
      },
      recentInterviews: recentInterviews.map(i => ({
        id: i._id,
        candidateName: i.candidateId?.name || 'Unknown',
        candidateRole: i.candidateId?.role || 'Unknown',
        status: i.status,
        sentiment: i.sentimentScore || 0,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

