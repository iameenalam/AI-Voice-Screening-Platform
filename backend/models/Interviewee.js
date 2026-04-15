import mongoose from 'mongoose';

const intervieweeSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  fullRole: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
  },
  cvUrl: {
    type: String,
    default: '',
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Interviewee', intervieweeSchema);
