const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  topicsCovered: {
    type: String,
    required: true
  },
  driveLink: {
    type: String,
    required: true
  },
  materialType: {
    type: String,
    enum: ['PDF', 'Recording', 'Other'],
    default: 'Recording'
  }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
