const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  studentName: {
    type: String,
    default: 'Student'
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'moderator', 'admin'],
    default: 'student'
  },
  joinTime: {
    type: Date,
    default: Date.now
  },
  leaveTime: {
    type: Date
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent'],
    default: 'Present'
  },
  zoomParticipantId: {
    type: String
  }
}, { timestamps: true });

attendanceSchema.index({ classId: 1, studentEmail: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
