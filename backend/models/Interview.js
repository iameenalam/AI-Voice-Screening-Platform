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
    // Uploaded recording of this answer (UploadThing URL, Candidate turns only).
    audioUrl: {
      type: String,
      default: '',
    },
    // Client-measured recording length, used for transcription cost estimates.
    audioDurationMs: {
      type: Number,
      default: 0,
    },
    // Where `text` came from: 'browser' (live speech recognition) until the
    // recording is transcribed server-side, then the transcription model name.
    transcriptSource: {
      type: String,
      default: 'browser',
    },
    // The original browser speech-recognition text, kept for reference after
    // `text` is replaced by the server-side transcription.
    interimText: {
      type: String,
      default: '',
    },
  }],
  // Competence score in 0..1 (relevance/correctness/clarity), averaged over
  // analysed answers. Named sentimentScore for backward compatibility.
  sentimentScore: {
    type: Number,
    default: 0,
  },
  // Whether the AI analysis pipeline actually produced a score for this
  // interview. When false, sentimentScore/confidence are not meaningful.
  aiAnalyzed: {
    type: Boolean,
    default: false,
  },
  // Fraction of questions that were successfully analysed (0..1).
  analysisCoverage: {
    type: Number,
    default: 0,
  },
  // Total USD cost of the AI calls made to score/summarise this interview.
  aiCostUsd: {
    type: Number,
    default: 0,
  },
  // Total tokens (prompt + completion) spent on this interview's AI calls.
  aiTokens: {
    type: Number,
    default: 0,
  },
  // Estimated USD cost of transcribing this interview's answer recordings.
  transcribeCostUsd: {
    type: Number,
    default: 0,
  },
  // True when at least one answer was transcribed from its audio recording
  // (i.e. scoring ran on accurate server-side transcripts, not browser text).
  audioTranscribed: {
    type: Boolean,
    default: false,
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

