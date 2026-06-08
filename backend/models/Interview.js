import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'candidateModel',
  },
  candidateModel: {
    type: String,
    required: true,
    enum: ['Candidate', 'Interviewee'],
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  interviewToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  expiresAt: {
    type: Date,
  },
  questions: [{
    type: mongoose.Schema.Types.Mixed,
    required: true,
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  transcript: [{
    speaker: {
      type: String,
      enum: ['AI', 'Candidate'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    questionIndex: {
      type: Number,
      default: -1,
    },
  }],
  sentimentScore: {
    type: Number,
    default: 0,
  },
  confidence: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  redFlags: [{
    type: String,
  }],
  aiSummary: {
    type: String,
    default: '',
  },
  recommendations: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});



export default mongoose.model('Interview', interviewSchema);

