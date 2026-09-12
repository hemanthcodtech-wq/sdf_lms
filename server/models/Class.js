const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, // e.g. "10:00 AM"
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  zoomLink: {
    type: String
  },
  zoomStartUrl: {
    type: String
  },
  zoomMeetingId: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  isRescheduled: {
    type: Boolean,
    default: false
  },
  originalDate: {
    type: String,
    default: null
  },
  originalTime: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
