const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: '1 hour'
  },
  mode: {
    type: String,
    enum: ['Online', 'Offline'],
    required: true
  },
  location: {
    type: String,
    required: function() { return this.mode === 'Offline'; }
  },
  meetingLink: {
    type: String,
    required: function() { return this.mode === 'Online'; }
  },
  interviewer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    designation: { type: String }
  },
  instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    outcome: { type: String, enum: ['Selected', 'Rejected', 'On Hold'] }
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
