import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  appliedCompany: {
    type: String,
    required: true,
  },
  jobField: {
    type: String,
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
  phone: {
    type: String,
    default: '',
  },
  cvUrl: {
    type: String,
    default: '',
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['applied', 'invited', 'interviewed'],
    default: 'applied',
  },
  interviewToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
  },
  isExternal: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Candidate', candidateSchema);

