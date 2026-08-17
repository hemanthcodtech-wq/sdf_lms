const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');

// Load env vars
dotenv.config({ path: __dirname + '/../.env' });

const courses = [
  {
    title: 'Foundations of Vinyasa Yoga',
    description: 'A comprehensive guide to the fundamentals of Vinyasa yoga. Learn breath synchronization and fluid movement.',
    category: 'Yoga',
    instructor: 'Aria Sharma',
    duration: '4 Weeks',
    language: 'English',
    whatYouWillLearn: [
      'Master fundamental Vinyasa poses',
      'Understand breath and movement connection',
      'Build core strength and flexibility',
      'Create your own sequences'
    ],
    level: 'Beginner',
    price: 49,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
    isPublished: true
  },
  {
    title: 'Advanced Mindfulness Meditation',
    description: 'Deepen your meditation practice with advanced mindfulness techniques to achieve greater focus and peace.',
    category: 'Meditation',
    instructor: 'Bodhi Path',
    duration: '6 Weeks',
    language: 'English',
    whatYouWillLearn: [
      'Deep states of concentration',
      'Vipassana techniques',
      'Managing thoughts and emotions',
      'Integrating mindfulness in daily life'
    ],
    level: 'Advanced',
    price: 79,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
    isPublished: true
  },
  {
    title: 'Ayurvedic Diet & Nutrition',
    description: 'Discover the ancient wisdom of Ayurveda to optimize your diet, improve digestion, and balance your doshas.',
    category: 'Nutrition',
    instructor: 'Dr. Vivek Nair',
    duration: '8 Weeks',
    language: 'English',
    whatYouWillLearn: [
      'Identify your dosha type',
      'Ayurvedic cooking basics',
      'Herbs and spices for healing',
      'Seasonal dietary adjustments'
    ],
    level: 'Intermediate',
    price: 99,
    thumbnailUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop',
    isPublished: true
  },
  {
    title: 'Pranayama: The Art of Breathing',
    description: 'Learn powerful breathing exercises to increase vitality, reduce stress, and awaken your life force energy.',
    category: 'Yoga',
    instructor: 'Master Lin',
    duration: '2 Weeks',
    language: 'English',
    whatYouWillLearn: [
      'Nadi Shodhana (Alternate Nostril Breathing)',
      'Kapalabhati (Skull Shining Breath)',
      'Ujjayi (Victorious Breath)',
      'Breath retention techniques'
    ],
    level: 'Beginner',
    price: 29,
    thumbnailUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1200&auto=format&fit=crop',
    isPublished: true
  },
  {
    title: 'Holistic Ayurveda for Wellness',
    description: 'An integrative approach to wellness using Ayurvedic principles, lifestyle practices, and natural remedies.',
    category: 'Ayurveda',
    instructor: 'Dr. Meera Patel',
    duration: '10 Weeks',
    language: 'English',
    whatYouWillLearn: [
      'Daily routines (Dinacharya)',
      'Ayurvedic herbs and their uses',
      'Detoxification methods',
      'Mind-body balancing'
    ],
    level: 'Intermediate',
    price: 129,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop',
    isPublished: true
  }
];

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing courses to avoid duplicates
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    for (const course of courses) {
      await Course.create(course);
    }
    console.log(`Successfully seeded ${courses.length} courses!`);
    
    process.exit();
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
};

seedCourses();
