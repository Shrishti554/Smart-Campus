const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  projects: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    duration: { type: String }
  }],
  education: [{
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    cgpa: { type: Number },
    passoutYear: { type: Number },
    field: { type: String }
  }],
  experience: [{
    company: { type: String, required: true },
    position: { type: String, required: true },
    duration: { type: String },
    description: { type: String }
  }],
  personalInfo: {
    phone: { type: String },
    address: { type: String },
    linkedin: { type: String },
    github: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
