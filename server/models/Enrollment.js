const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    default: 'completed'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completed: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date,
    default: null
  },
  certificateId: {
    type: String,
    default: null
  },
  invoiceNumber: {
    type: String,
    default: null
  },
  certificateUrl: {
    type: String,
    default: null
  },
  invoiceUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
