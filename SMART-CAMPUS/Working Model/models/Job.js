const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    required: true
  },
  salary: {
    min: { type: Number, required: true },
    max: { type: Number, required: false },
    currency: { type: String, default: 'INR' },
    type: { type: String, enum: ['per annum', 'per month'], default: 'per annum' }
  },
  location: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    required: true
  },
  eligibilityCriteria: {
    minCGPA: { type: Number, required: false },
    maxBacklogs: { type: Number, required: false },
    branches: [{ type: String }],
    passoutYear: { type: Number, required: false },
    skillsRequired: [{ type: String }]
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalApplications: {
    type: Number,
    default: 0
  },
  positionsAvailable: {
    type: Number,
    required: true
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
