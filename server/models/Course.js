const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  title_te: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  description_te: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: ['Yoga', 'Meditation', 'Nutrition', 'Ayurveda', 'Other']
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  instructor: {
    type: String
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderator: {
    type: String
  },
  durationMonths: {
    type: Number,
    required: true,
    default: 1
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  timings: {
    type: String, // e.g. '06:00 to 07:15'
  },
  sessionDates: {
    type: [String],
    default: []
  },
  zoomMeetingLink: {
    type: String
  },
  whatsappGroupLink: {
    type: String,
    trim: true,
    default: ''
  },
  topics: {
    type: [String],
    default: []
  },
  topics_te: {
    type: [String],
    default: []
  },
  language: {
    type: String,
    default: 'English'
  },
  accessValidity: {
    type: String,
    default: '2 Months'
  },
  whatYouWillLearn: {
    type: [String],
    default: []
  },
  whatYouWillLearn_te: {
    type: [String],
    default: []
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnailUrl: {
    type: String
  },
  contentUrl: {
    type: String // PDF or Video URL
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

courseSchema.pre('save', function() {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
});

module.exports = mongoose.model('Course', courseSchema);
