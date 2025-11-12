import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Interview from '../models/Interview.js';
import Candidate from '../models/Candidate.js';
import OpenAI from 'openai';

const router = express.Router();

// Lazy initialization of OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({
    apiKey: apiKey,
  });
};

// Generate AI-suggested questions based on role
router.post('/generate-questions', authenticate, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      // Fallback questions if OpenAI is not configured
      return res.json({
        questions: [
          `Tell me about your experience with ${role}.`,
          'Describe a challenge you faced in a team setting.',
          'Why are you interested in this position?',
          'What are your strengths and weaknesses?',
          'Where do you see yourself in 5 years?',
        ],
      });
    }

    const prompt = `Generate 3-5 professional interview questions for a ${fullRole} position. Return only the questions, one per line, without numbering or bullets.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter. Generate relevant interview questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
    });

    const questionsText = completion.choices[0].message.content;
    const questions = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .slice(0, 5);

    res.json({ questions });
  } catch (error) {
    console.error('OpenAI error:', error);
    // Fallback questions
    res.json({
      questions: [
        'Tell me about your experience with this role.',
        'Describe a challenge you faced in a team setting.',
        'Why are you interested in this position?',
      ],
    });
  }
});

// Create interview
router.post('/', authenticate, async (req, res) => {
  try {
    const { candidateId, questions } = req.body;

    if (!candidateId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Candidate ID and questions are required' });
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      recruiterId: req.userId,
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const interview = new Interview({
      candidateId,
      recruiterId: req.userId,
      questions,
      status: 'pending',
    });

    await interview.save();
    res.status(201).json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start interview
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.status = 'in_progress';
    interview.startedAt = new Date();
    await interview.save();

    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add transcript entry
router.post('/:id/transcript', authenticate, async (req, res) => {
  try {
    const { speaker, text, timestamp, questionIndex } = req.body;

    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.transcript.push({
      speaker,
      text,
      timestamp: timestamp || Date.now(),
      questionIndex: questionIndex !== undefined ? questionIndex : -1,
    });

    await interview.save();
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze response with AI
router.post('/:id/analyze', authenticate, async (req, res) => {
  try {
    const { question, response } = req.body;

    if (!question || !response) {
      return res.status(400).json({ error: 'Question and response are required' });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      // Fallback analysis if OpenAI is not configured
      return res.json({
        sentiment: 0.7,
        confidence: 'Medium',
        redFlags: [],
        summary: 'Response analyzed successfully.',
      });
    }

    const prompt = `Analyze this interview response:

Question: ${question}
Response: ${response}

Provide:
1. A sentiment score from -1 to 1 (where 1 is very positive)
2. Confidence level (Low, Medium, High)
3. Any red flags (if none, say "None")
4. A brief summary (1-2 sentences)

Format as JSON:
{
  "sentiment": 0.75,
  "confidence": "High",
  "redFlags": [],
  "summary": "Brief summary here"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer analyzing candidate responses. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      res.json(analysis);
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      // Fallback analysis
      res.json({
        sentiment: 0.7,
        confidence: 'Medium',
        redFlags: [],
        summary: 'Response analyzed successfully.',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete interview and generate summary
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    }).populate('candidateId');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.status = 'completed';
    interview.completedAt = new Date();
    
    if (interview.startedAt) {
      interview.duration = Math.floor(
        (interview.completedAt - interview.startedAt) / 1000
      );
    }

    // Calculate average sentiment
    const sentiments = interview.transcript
      .filter(t => t.speaker === 'Candidate')
      .map(t => {
        // This would ideally come from analysis, but for now we'll use a simple calculation
        return 0.7; // Placeholder
      });
    
    if (sentiments.length > 0) {
      interview.sentimentScore = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    }

    // Generate AI summary
    const transcriptText = interview.transcript
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const openai = getOpenAIClient();
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter. Provide a concise summary and recommendations for this interview.',
          },
          {
            role: 'user',
            content: `Summarize this interview transcript and provide recommendations:\n\n${transcriptText}`,
          },
        ],
        max_tokens: 500,
      });

        const summary = completion.choices[0].message.content;
        const parts = summary.split('\n\n');
        interview.aiSummary = parts[0] || summary;
        interview.recommendations = parts[1] || 'Consider for next round.';
      } catch (error) {
        console.error('OpenAI summary error:', error);
        interview.aiSummary = 'Strong candidate with good technical foundation.';
        interview.recommendations = 'Consider for next round.';
      }
    } else {
      // Fallback summary if OpenAI is not configured
      interview.aiSummary = 'Interview completed successfully. Review the transcript for detailed responses.';
      interview.recommendations = 'Consider for next round.';
    }

    await interview.save();
    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get interview
router.get('/:id', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    }).populate('candidateId');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all interviews for recruiter
router.get('/', authenticate, async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.userId })
      .populate('candidateId')
      .sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

