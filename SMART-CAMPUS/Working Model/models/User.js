const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin', 'company', 'placement'], 
    required: true 
  },
  fullName: { 
    type: String, 
    default: '' 
  },
  department: { 
    type: String, 
    default: '' 
  },
  phone: { 
    type: String, 
    default: '' 
  },
  about: { 
    type: String, 
    default: '' 
  },
  isProfileComplete: { 
    type: Boolean, 
    default: false 
  },
  studentDetails: {
    rollNumber: { type: String, sparse: true },
    branch: { type: String, sparse: true },
    year: { type: Number, sparse: true },
    cgpa: { type: Number, min: 0, max: 10, sparse: true },
    backlogs: { type: Number, default: 0, sparse: true },
    passoutYear: { type: Number, sparse: true },
    skills: [{ type: String }],
    resumeUploaded: { type: Boolean, default: false }
  },
  companyDetails: {
    companyName: { type: String, sparse: true },
    companyVerified: { type: Boolean, default: false },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', sparse: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);