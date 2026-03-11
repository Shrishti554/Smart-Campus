const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['job_posted', 'application_status', 'interview_scheduled', 'placement_result', 'general'],
    required: true
  },
  relatedEntity: {
    entityType: { type: String, enum: ['Job', 'Application', 'Interview'] },
    entityId: { type: mongoose.Schema.Types.ObjectId }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
