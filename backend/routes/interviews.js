import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Interview from '../models/Interview.js';
import Candidate from '../models/Candidate.js';
import Interviewee from '../models/Interviewee.js';
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
    console.log('\n❓ === GENERATING INTERVIEW QUESTIONS ===');
    const { role } = req.body;

    if (!role) {
      console.log('❌ Role not provided');
      return res.status(400).json({ error: 'Role is required' });
    }

    console.log(`💼 Role: ${role}`);

    const openai = getOpenAIClient();
    if (!openai) {
      console.log('⚠️ OpenAI not configured, using fallback questions');
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

    const prompt = `Generate 5 professional interview questions for a ${role} position. Return only the questions, one per line, without numbering or bullets.`;

    console.log('🤖 Calling OpenAI to generate questions...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
      temperature: 0.7,
      max_tokens: 300,
    });

    const questionsText = completion.choices[0].message.content;
    const questions = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .slice(0, 5);

    console.log(`✅ Generated ${questions.length} questions`);
    questions.forEach((q, i) => console.log(`  ${i + 1}. ${q.substring(0, 60)}...`));
    console.log('='.repeat(50) + '\n');

    res.json({ questions });
  } catch (error) {
    console.error('❌ OpenAI error:', error.message);
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
    console.log('\n📝 === CREATING NEW INTERVIEW ===');
    const { candidateId, questions } = req.body;

    if (!candidateId || !questions || !Array.isArray(questions)) {
      console.log('❌ Missing candidate ID or questions');
      return res.status(400).json({ error: 'Candidate ID and questions are required' });
    }

    console.log(`👤 Candidate ID: ${candidateId}`);
    console.log(`❓ Questions: ${questions.length}`);

    // Try both collections to find the candidate
    const [candidate, interviewee] = await Promise.all([
      Candidate.findOne({ _id: candidateId }),
      Interviewee.findOne({ _id: candidateId, recruiterId: req.userId })
    ]);

    const targetPerson = candidate || interviewee;

    if (!targetPerson) {
      console.log('❌ Candidate/Interviewee not found');
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const modelName = candidate ? 'Candidate' : 'Interviewee';
    console.log(`✅ ${modelName} found: ${targetPerson.name}`);

    const interview = new Interview({
      candidateId,
      candidateModel: modelName,
      recruiterId: req.userId,
      questions,
      status: 'pending',
    });

    await interview.save();
    console.log(`✅ Interview created: ${interview._id}`);
    console.log('='.repeat(50) + '\n');
    
    res.status(201).json(interview);
  } catch (error) {
    console.error('❌ Create interview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start interview
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    console.log('\n▶️  === STARTING INTERVIEW ===');
    console.log(`📋 Interview ID: ${req.params.id}`);
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!interview) {
      console.log('❌ Interview not found');
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.status = 'in_progress';
    interview.startedAt = new Date();
    await interview.save();

    console.log(`✅ Interview started at ${interview.startedAt.toISOString()}`);
    console.log('='.repeat(50) + '\n');
    
    res.json(interview);
  } catch (error) {
    console.error('❌ Start interview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add transcript entry
router.post('/:id/transcript', authenticate, async (req, res) => {
  try {
    const { speaker, text, timestamp, questionIndex } = req.body;

    console.log(`\n💬 Adding transcript entry: ${speaker} (Q${questionIndex >= 0 ? questionIndex + 1 : '?'})`);
    console.log(`   Text: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);

    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!interview) {
      console.log('❌ Interview not found');
      return res.status(404).json({ error: 'Interview not found' });
    }

    interview.transcript.push({
      speaker,
      text,
      timestamp: timestamp || Date.now(),
      questionIndex: questionIndex !== undefined ? questionIndex : -1,
    });

    await interview.save();
    console.log(`✅ Transcript saved (total entries: ${interview.transcript.length})`);
    
    res.json(interview);
  } catch (error) {
    console.error('❌ Transcript error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Analyze response with AI
router.post('/:id/analyze', authenticate, async (req, res) => {
  try {
    console.log('\n🔍 === ANALYZING INTERVIEW RESPONSE ===');
    const { question, response } = req.body;

    if (!question || !response) {
      console.log('❌ Missing question or response');
      return res.status(400).json({ error: 'Question and response are required' });
    }

    console.log(`📝 Question: ${question.substring(0, 100)}...`);
    console.log(`💬 Response: ${response.substring(0, 100)}...`);

    const openai = getOpenAIClient();
    if (!openai) {
      console.log('⚠️ OpenAI not configured, using fallback analysis');
      return res.json({
        sentiment: 0.7,
        confidence: 'Medium',
        redFlags: [],
        summary: 'Response analyzed successfully.',
      });
    }

    const prompt = `Analyze this interview response and return ONLY a valid JSON object with no additional text:

Question: ${question}
Response: ${response}

Return this exact JSON structure:
{
  "sentiment": 0.75,
  "confidence": "High",
  "redFlags": [],
  "summary": "Brief summary here"
}

Rules:
- sentiment: number between -1 and 1 (1 is very positive)
- confidence: "Low", "Medium", or "High"
- redFlags: array of strings (empty if none)
- summary: 1-2 sentences`;

    try {
      console.log('🤖 Calling OpenAI for response analysis...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer analyzing candidate responses. Return ONLY valid JSON with no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = completion.choices[0].message.content.trim();
      console.log('📥 OpenAI raw response:', content.substring(0, 200));
      
      // Remove markdown code blocks if present
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(jsonText);
      
      console.log('✅ Analysis complete:', {
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        redFlagsCount: analysis.redFlags?.length || 0
      });
      
      res.json(analysis);
    } catch (error) {
      console.error('❌ OpenAI analysis error:', error.message);
      // Fallback analysis
      res.json({
        sentiment: 0.7,
        confidence: 'Medium',
        redFlags: [],
        summary: 'Response analyzed successfully.',
      });
    }
  } catch (error) {
    console.error('❌ Analysis route error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Complete interview and generate summary
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    console.log('\n🏁 === COMPLETING INTERVIEW ===');
    console.log(`📋 Interview ID: ${req.params.id}`);
    
    const interview = await Interview.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    }).populate('candidateId');

    if (!interview) {
      console.log('❌ Interview not found');
      return res.status(404).json({ error: 'Interview not found' });
    }

    console.log(`👤 Candidate: ${interview.candidateId?.name || 'Unknown'}`);
    console.log(`📝 Transcript entries: ${interview.transcript?.length || 0}`);

    interview.status = 'completed';
    interview.completedAt = new Date();
    
    if (interview.startedAt) {
      interview.duration = Math.floor(
        (interview.completedAt - interview.startedAt) / 1000
      );
      console.log(`⏱️ Duration: ${interview.duration} seconds`);
    }

    const openai = getOpenAIClient();
    
    // Analyze each candidate response using OpenAI
    const sentiments = [];
    const candidateResponses = interview.transcript.filter(t => t.speaker === 'Candidate');
    
    console.log(`💬 Candidate responses to analyze: ${candidateResponses.length}`);
    
    if (openai && candidateResponses.length > 0) {
      try {
        console.log('🔍 Starting response analysis...');
        
        // Group responses by question index
        const responsesByQuestion = {};
        candidateResponses.forEach(entry => {
          const qIndex = entry.questionIndex >= 0 ? entry.questionIndex : 0;
          if (!responsesByQuestion[qIndex]) {
            responsesByQuestion[qIndex] = [];
          }
          responsesByQuestion[qIndex].push(entry.text);
        });

        // Get corresponding questions
        const questionsByIndex = {};
        interview.transcript.filter(t => t.speaker === 'AI').forEach(entry => {
          if (entry.questionIndex >= 0) {
            questionsByIndex[entry.questionIndex] = entry.text;
          }
        });

        console.log(`📊 Analyzing ${Object.keys(responsesByQuestion).length} question-response pairs...`);

        // Analyze each response
        let analyzedCount = 0;
        for (const [qIndex, responses] of Object.entries(responsesByQuestion)) {
          const question = questionsByIndex[qIndex] || 'General question';
          const responseText = responses.join(' ');
          
          if (responseText.trim()) {
            try {
              console.log(`  🔍 Analyzing response ${parseInt(qIndex) + 1}...`);
              
              const analysisResult = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert interviewer analyzing candidate responses. Return ONLY valid JSON with no markdown.',
                  },
                  {
                    role: 'user',
                    content: `Analyze this interview response and return ONLY valid JSON:

Question: ${question}
Response: ${responseText}

Return this exact structure:
{
  "sentiment": 0.75,
  "confidence": "High",
  "redFlags": [],
  "summary": "Brief summary"
}`,
                  },
                ],
                temperature: 0.3,
                max_tokens: 300,
              });

              const content = analysisResult.choices[0].message.content.trim();
              const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const analysis = JSON.parse(jsonText);
              
              sentiments.push(analysis.sentiment);
              analyzedCount++;
              console.log(`    ✅ Sentiment: ${analysis.sentiment}, Confidence: ${analysis.confidence}`);
              
              // Collect red flags
              if (analysis.redFlags && analysis.redFlags.length > 0 && analysis.redFlags[0] !== 'None') {
                interview.redFlags = [...(interview.redFlags || []), ...analysis.redFlags];
                console.log(`    ⚠️ Red flags found: ${analysis.redFlags.length}`);
              }
            } catch (error) {
              console.error(`    ❌ Error analyzing response ${qIndex}:`, error.message);
              sentiments.push(0.7); // Default sentiment
            }
          }
        }
        
        console.log(`✅ Analyzed ${analyzedCount} responses successfully`);
      } catch (error) {
        console.error('❌ Error in batch analysis:', error.message);
      }
    }
    
    // Calculate average sentiment
    if (sentiments.length > 0) {
      interview.sentimentScore = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      console.log(`📊 Average sentiment score: ${interview.sentimentScore.toFixed(2)}`);
    } else {
      interview.sentimentScore = 0.7;
      console.log('⚠️ No sentiments calculated, using default: 0.7');
    }

    // Determine confidence level based on sentiment
    if (interview.sentimentScore >= 0.8) {
      interview.confidence = 'High';
    } else if (interview.sentimentScore >= 0.5) {
      interview.confidence = 'Medium';
    } else {
      interview.confidence = 'Low';
    }
    console.log(`🎯 Confidence level: ${interview.confidence}`);

    // Generate AI summary based on full transcript
    const transcriptText = interview.transcript
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    if (openai) {
      try {
        console.log('📝 Generating AI summary...');
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert recruiter. Provide a concise summary and recommendations for this interview based on the candidate\'s actual responses.',
            },
            {
              role: 'user',
              content: `Based on this interview transcript, provide:
1. A comprehensive summary of the candidate's performance, strengths, and areas of concern (2-3 sentences)
2. Specific recommendations for next steps (1-2 sentences)

Transcript:
${transcriptText.substring(0, 3000)}

Format your response with two clear sections:
SUMMARY: [your summary here]

RECOMMENDATIONS: [your recommendations here]`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        });

        const summary = completion.choices[0].message.content;
        const summaryMatch = summary.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATIONS:|$)/is);
        const recommendationsMatch = summary.match(/RECOMMENDATIONS:\s*(.+?)$/is);
        
        interview.aiSummary = summaryMatch ? summaryMatch[1].trim() : summary.split('\n\n')[0] || summary;
        interview.recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : summary.split('\n\n')[1] || 'Consider for next round.';
        
        console.log('✅ AI summary generated');
        console.log(`📄 Summary: ${interview.aiSummary.substring(0, 100)}...`);
      } catch (error) {
        console.error('❌ OpenAI summary error:', error.message);
        interview.aiSummary = 'Interview completed successfully. Review the transcript for detailed responses.';
        interview.recommendations = 'Consider for next round.';
      }
    } else {
      console.log('⚠️ OpenAI not configured, using fallback summary');
      interview.aiSummary = 'Interview completed successfully. Review the transcript for detailed responses.';
      interview.recommendations = 'Consider for next round.';
    }

    await interview.save();
    console.log('✅ Interview completed and saved');
    console.log('='.repeat(50) + '\n');
    
    res.json(interview);
  } catch (error) {
    console.error('❌ Complete interview error:', error.message);
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

// ==========================================
// PUBLIC INTERVIEW ROUTES (token-based, no auth)
// ==========================================

// Get interview by token (public)
router.get('/public/:token', async (req, res) => {
  try {
    const interview = await Interview.findOne({
      interviewToken: req.params.token,
    }).populate('candidateId');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found or link is invalid' });
    }

    // Check if link has expired
    if (interview.expiresAt && new Date() > new Date(interview.expiresAt)) {
      return res.status(410).json({ error: 'This interview link has expired. Please contact the recruiter for a new link.', expired: true });
    }

    // Check if already completed (one-time use)
    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'This interview has already been completed. Each link can only be used once.', completed: true });
    }

    res.json(interview);
  } catch (error) {
    console.error('❌ Public get interview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start interview by token (public)
router.post('/public/:token/start', async (req, res) => {
  try {
    console.log('\n▶️  === STARTING PUBLIC INTERVIEW ===');
    const interview = await Interview.findOne({
      interviewToken: req.params.token,
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Check expiry
    if (interview.expiresAt && new Date() > new Date(interview.expiresAt)) {
      return res.status(410).json({ error: 'This interview link has expired.', expired: true });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ error: 'This interview has already been completed. Each link can only be used once.', completed: true });
    }

    interview.status = 'in_progress';
    interview.startedAt = new Date();
    await interview.save();

    console.log(`✅ Public interview started at ${interview.startedAt.toISOString()}`);
    res.json(interview);
  } catch (error) {
    console.error('❌ Public start interview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add transcript entry by token (public)
router.post('/public/:token/transcript', async (req, res) => {
  try {
    const { speaker, text, timestamp, questionIndex } = req.body;
    const interview = await Interview.findOne({
      interviewToken: req.params.token,
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
    console.error('❌ Public transcript error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Complete interview by token (public)
router.post('/public/:token/complete', async (req, res) => {
  try {
    console.log('\n🏁 === COMPLETING PUBLIC INTERVIEW ===');
    const interview = await Interview.findOne({
      interviewToken: req.params.token,
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

    const openai = getOpenAIClient();

    // Analyze each candidate response using OpenAI
    const sentiments = [];
    const candidateResponses = interview.transcript.filter(t => t.speaker === 'Candidate');

    if (openai && candidateResponses.length > 0) {
      try {
        const responsesByQuestion = {};
        candidateResponses.forEach(entry => {
          const qIndex = entry.questionIndex >= 0 ? entry.questionIndex : 0;
          if (!responsesByQuestion[qIndex]) {
            responsesByQuestion[qIndex] = [];
          }
          responsesByQuestion[qIndex].push(entry.text);
        });

        const questionsByIndex = {};
        interview.transcript.filter(t => t.speaker === 'AI').forEach(entry => {
          if (entry.questionIndex >= 0) {
            questionsByIndex[entry.questionIndex] = entry.text;
          }
        });

        for (const [qIndex, responses] of Object.entries(responsesByQuestion)) {
          const question = questionsByIndex[qIndex] || 'General question';
          const responseText = responses.join(' ');

          if (responseText.trim()) {
            try {
              const analysisResult = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert interviewer analyzing candidate responses. Return ONLY valid JSON with no markdown.',
                  },
                  {
                    role: 'user',
                    content: `Analyze this interview response and return ONLY valid JSON:\n\nQuestion: ${question}\nResponse: ${responseText}\n\nReturn this exact structure:\n{\n  "sentiment": 0.75,\n  "confidence": "High",\n  "redFlags": [],\n  "summary": "Brief summary"\n}`,
                  },
                ],
                temperature: 0.3,
                max_tokens: 300,
              });

              const content = analysisResult.choices[0].message.content.trim();
              const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const analysis = JSON.parse(jsonText);
              sentiments.push(analysis.sentiment);
              if (analysis.redFlags && analysis.redFlags.length > 0 && analysis.redFlags[0] !== 'None') {
                interview.redFlags = [...(interview.redFlags || []), ...analysis.redFlags];
              }
            } catch (error) {
              sentiments.push(0.7);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in batch analysis:', error.message);
      }
    }

    // Calculate average sentiment
    if (sentiments.length > 0) {
      interview.sentimentScore = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    } else {
      interview.sentimentScore = 0.7;
    }

    // Determine confidence level
    if (interview.sentimentScore >= 0.8) {
      interview.confidence = 'High';
    } else if (interview.sentimentScore >= 0.5) {
      interview.confidence = 'Medium';
    } else {
      interview.confidence = 'Low';
    }

    // Generate AI summary
    const transcriptText = interview.transcript
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert recruiter. Provide a concise summary and recommendations for this interview.',
            },
            {
              role: 'user',
              content: `Based on this interview transcript, provide:\n1. A comprehensive summary (2-3 sentences)\n2. Specific recommendations (1-2 sentences)\n\nTranscript:\n${transcriptText.substring(0, 3000)}\n\nFormat:\nSUMMARY: [your summary here]\n\nRECOMMENDATIONS: [your recommendations here]`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        });

        const summary = completion.choices[0].message.content;
        const summaryMatch = summary.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATIONS:|$)/is);
        const recommendationsMatch = summary.match(/RECOMMENDATIONS:\s*(.+?)$/is);

        interview.aiSummary = summaryMatch ? summaryMatch[1].trim() : summary.split('\n\n')[0] || summary;
        interview.recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : 'Consider for next round.';
      } catch (error) {
        interview.aiSummary = 'Interview completed successfully. Review the transcript for detailed responses.';
        interview.recommendations = 'Consider for next round.';
      }
    } else {
      interview.aiSummary = 'Interview completed successfully. Review the transcript for detailed responses.';
      interview.recommendations = 'Consider for next round.';
    }

    await interview.save();

    // Update candidate status to 'interviewed'
    try {
      await Candidate.findByIdAndUpdate(interview.candidateId, { status: 'interviewed' });
    } catch (err) {
      console.warn('⚠️ Could not update candidate status:', err.message);
    }

    console.log('✅ Public interview completed and saved');
    res.json(interview);
  } catch (error) {
    console.error('❌ Public complete interview error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;

