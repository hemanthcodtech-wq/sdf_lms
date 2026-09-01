const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  topicsCovered: {
    type: String,
    required: true,
    trim: true
  },
  driveLink: {
    type: String,
    required: true,
    trim: true
  },
  materialType: {
    type: String,
    default: 'Recording'
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
