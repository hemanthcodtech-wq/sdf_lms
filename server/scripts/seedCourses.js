const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Course = require('../models/Course');
const Class = require('../models/Class');
const Material = require('../models/Material');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

const coursesData = [
  {
    title: 'Hatha Yoga for Strength & Flexibility',
    title_te: 'శక్తి మరియు వశ్యత కోసం హఠ యోగా',
    slug: 'hatha-yoga-for-strength-flexibility',
    description: 'Master foundational and intermediate Hatha Yoga asanas to build core physical strength, correct posture, and enhance overall body flexibility with daily guided live sessions.',
    description_te: 'కోర్ శారీరక బలాన్ని నిర్మించడానికి, భంగిమను సరిచేయడానికి మరియు రోజువారీ గైడెడ్ లైవ్ సెషన్‌లతో మొత్తం శరీర వశ్యతను మెరుగుపరచడానికి ప్రాథమిక మరియు ఇంటర్మీడియట్ హఠ యోగా ఆసనాలను నేర్చుకోండి.',
    category: 'Yoga',
    instructor: 'Acharya Rajesh Sharma',
    durationMonths: 1,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-09-25'),
    timings: '06:30 AM to 07:30 AM',
    level: 'Beginner',
    language: 'English & Telugu',
    price: 999,
    thumbnailUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80',
    topics: [
      'Surya Namaskar & Warmups',
      'Standing Balance Asanas',
      'Core & Back Strengthening',
      'Forward Bends & Hip Openers',
      'Cool down & Savasana'
    ],
    topics_te: [
      'సూర్య నమస్కారాలు & వార్మప్‌లు',
      'స్టాండింగ్ బ్యాలెన్స్ ఆసనాలు',
      'కోర్ & వెన్ను బలోపేతం',
      'ఫార్వర్డ్ బెండ్స్ & హిప్ ఓపెనర్స్',
      'శవాసన & రిలాక్సేషన్'
    ],
    whatYouWillLearn: [
      'Improve joint mobility and muscular endurance',
      'Correct body posture and spinal alignment',
      'Learn correct breathing sync with physical movements',
      'Develop daily wellness habit'
    ],
    whatYouWillLearn_te: [
      'కీళ్ల కదలిక మరియు కండరాల ఓర్పును మెరుగుపరచండి',
      'శరీర భంగిమ మరియు వెన్నెముక అమరికను సరిచేయండి',
      'శారీరక కదలికలతో శ్వాస సమకాలీకరణను తెలుసుకోండి',
      'రోజువారీ వెల్నెస్ అలవాటును పెంచుకోండి'
    ],
    isPublished: true,
    sessionsCount: 15,
    startTime: '06:30',
    meetingIdPrefix: '849201'
  },
  {
    title: 'Mindfulness & Deep Meditation Mastery',
    title_te: 'మైండ్‌ఫుల్‌నెస్ & గాఢ ధ్యాన సాధన',
    slug: 'mindfulness-deep-meditation-mastery',
    description: 'Transform your mental clarity, conquer anxiety, and unlock inner peace through ancient Vipassana, Chakra alignment, and modern guided mindfulness techniques.',
    description_te: 'పురాతన విపాసన, చక్ర అమరిక మరియు ఆధునిక గైడెడ్ మైండ్‌ఫుల్‌నెస్ పద్ధతుల ద్వారా మీ మానసిక స్పష్టతను మార్చుకోండి, ఆందోళనను జయించండి మరియు అంతర్గత శాంతిని అన్‌లాక్ చేయండి.',
    category: 'Meditation',
    instructor: 'Dr. Sunita Varma',
    durationMonths: 1,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-09-25'),
    timings: '07:00 PM to 08:00 PM',
    level: 'Beginner',
    language: 'English & Telugu',
    price: 799,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    topics: [
      'Breath Awareness (Anapanasati)',
      'Body Scan & Stress Release',
      'Chakra Meditation & Visualization',
      'Loving-Kindness (Metta) Practice',
      'Cultivating Daily Stillness'
    ],
    topics_te: [
      'శ్వాస స్పృహ (ఆనాపానసతి)',
      'బాడీ స్కాన్ & ఒత్తిడి విడుదల',
      'చక్ర ధ్యానం & విజువలైజేషన్',
      'మెత్తా సాధన',
      'రోజువారీ నిశ్చలతను పెంపొందించడం'
    ],
    whatYouWillLearn: [
      'Deep state of mental relaxation in under 10 minutes',
      'Techniques to eliminate racing thoughts & anxiety',
      'Enhance focus, memory retention and emotional balance',
      'Sustain restful, deep sleep cycles'
    ],
    whatYouWillLearn_te: [
      '10 నిమిషాల కంటే తక్కువ సమయంలో మానసిక విశ్రాంతి',
      'ఆందోళనను తొలగించే పద్ధతులు',
      'ఏకాగ్రత మరియు భావోద్వేగ సమతుల్యతను పెంచుకోండి',
      'గాఢ నిద్ర చక్రాన్ని నిర్వహించండి'
    ],
    isPublished: true,
    sessionsCount: 15,
    startTime: '19:00',
    meetingIdPrefix: '912304'
  },
  {
    title: 'Pranayama & Yogic Breathwork Detox',
    title_te: 'ప్రాణాయామం & యోగా శ్వాసక్రియ డిటాక్స్',
    slug: 'pranayama-yogic-breathwork-detox',
    description: 'Learn the sacred science of vital life energy (Prana). Detoxify your respiratory system, increase lung capacity, and harmonize your nervous system through clinical pranayama.',
    description_te: 'ప్రాణ శక్తి యొక్క పవిత్ర శాస్త్రాన్ని తెలుసుకోండి. శ్వాసకోశ వ్యవస్థను డిటాక్సిఫై చేయండి, ఊపిరితిత్తుల సామర్థ్యాన్ని పెంచండి మరియు నాడీ వ్యవస్థను సమతుల్యం చేయండి.',
    category: 'Yoga',
    instructor: 'Swami Anandamurti',
    durationMonths: 1,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-09-25'),
    timings: '06:00 AM to 07:00 AM',
    level: 'Intermediate',
    language: 'Telugu',
    price: 899,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    topics: [
      'Kapalabhati & Cellular Cleansing',
      'Anulom Vilom (Alternate Nostril Breathing)',
      'Bhastrika & Vital Energy Expansion',
      'Bhramari & Sound Resonance Healing',
      'Sheetali & Body Cooling Pranayama'
    ],
    topics_te: [
      'కపాలభాతి & సెల్యులార్ క్లెన్సింగ్',
      'అనులోమ విలోమ ప్రాణాయామం',
      'భస్త్రిక & ప్రాణ శక్తి విస్తరణ',
      'భ్రామరి & సౌండ్ హీలింగ్',
      'శీతలి & శీతకారి ప్రాణాయామం'
    ],
    whatYouWillLearn: [
      'Boost oxygen levels and vital lung capacity',
      'Calm down hyperactive autonomic nervous responses',
      'Improve digestive fire and metabolic speed',
      'Achieve sustained daytime alertness and energy'
    ],
    whatYouWillLearn_te: [
      'ఆక్సిజన్ స్థాయిలు మరియు ఊపిరితిత్తుల సామర్థ్యాన్ని పెంచండి',
      'నాడీ ప్రతిస్పందనలను శాంతపరచండి',
      'జీర్ణక్రియ మరియు జీవక్రియ వేగాన్ని మెరుగుపరచండి',
      'పగటిపూట నిరంతర చురుకుదనం పొందండి'
    ],
    isPublished: true,
    sessionsCount: 15,
    startTime: '06:00',
    meetingIdPrefix: '738192'
  },
  {
    title: 'Ayurvedic Nutrition & Holistic Diet',
    title_te: 'ఆయుర్వేద పోషకాహారం & సంపూర్ణ డైట్',
    slug: 'ayurvedic-nutrition-holistic-diet',
    description: 'Discover your unique body constitution (Vata, Pitta, Kapha) and design wholesome seasonal meal plans to boost immunity, restore gut health, and prevent chronic diseases.',
    description_te: 'మీ ప్రత్యేక శరీర ప్రకృతిని (వాత, పిత్త, కఫ) కనుగొనండి మరియు రోగనిరోధక శక్తిని పెంచడానికి, గట్ ఆరోగ్యాన్ని పునరుద్ధరించడానికి కాలానుగుణ ఆహార ప్రణాళికలను రూపొందించండి.',
    category: 'Nutrition',
    instructor: 'Dr. Priya Nambiar (BAMS)',
    durationMonths: 1,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-09-25'),
    timings: '08:00 AM to 09:00 AM',
    level: 'Beginner',
    language: 'English',
    price: 1199,
    thumbnailUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
    topics: [
      'Understanding Tri-Doshas (Vata, Pitta, Kapha)',
      'The Power of Agni (Digestive Fire)',
      'Healing Kitchen Spices & Herbal Tonics',
      'Dinacharya (Daily Ayurvedic Routine)',
      'Seasonal Detox Meals & Fasting Wisdom'
    ],
    topics_te: [
      'త్రిదోషాలు (వాత, పిత్త, కఫ) అవగాహన',
      'అగ్ని యొక్క శక్తి (జీర్ణక్రియ)',
      'వంటగది సుగంధ ద్రవ్యాలు & మూలికలు',
      'దినచర్య & జీవనశైలి',
      'కాలానుగుణ డిటాక్స్ భోజనం & ఉపవాసం'
    ],
    whatYouWillLearn: [
      'Self-diagnose your dominant Prakriti and Vikriti',
      'Formulate tailored balanced meals for gut healing',
      'Harness kitchen spices as potent natural remedies',
      'Eliminate chronic bloating, acidity, and fatigue'
    ],
    whatYouWillLearn_te: [
      'మీ ప్రకృతి మరియు వికృతిని గుర్తించండి',
      'గట్ హీలింగ్ కోసం సమతుల్య ఆహారాన్ని రూపొందించండి',
      'సహజ నివారణలుగా వంటగది సుగంధ ద్రవ్యాలను వాడండి',
      'ఎసిడిటీ మరియు అలసటను తొలగించండి'
    ],
    isPublished: true,
    sessionsCount: 15,
    startTime: '08:00',
    meetingIdPrefix: '654321'
  },
  {
    title: 'Ashtanga Vinyasa Flow & Power Yoga',
    title_te: 'అష్టాంగ విన్యాస ఫ్లో & పవర్ యోగా',
    slug: 'ashtanga-vinyasa-flow-power-yoga',
    description: 'Dynamic and rigorous movement designed for intermediate to advanced practitioners seeking weight management, muscle toning, agility, and cardiovascular conditioning.',
    description_te: 'బరువు నిర్వహణ, కండరాల టోనింగ్, చురుకుదనం మరియు కార్డియోవాస్కులర్ కండిషనింగ్ కోరుకునే వారి కోసం డైనమిక్ మరియు శక్తివంతమైన పవర్ యోగా సెషన్‌లు.',
    category: 'Yoga',
    instructor: 'Guru Vikram Rathod',
    durationMonths: 1,
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-09-25'),
    timings: '05:30 PM to 06:30 PM',
    level: 'Advanced',
    language: 'English & Telugu',
    price: 1499,
    thumbnailUrl: 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?w=800&auto=format&fit=crop&q=80',
    topics: [
      'Primary Series Sun Salutations A & B',
      'Jump Throughs & Jump Backs Technique',
      'Arm Balances & Inversion Prep',
      'Dynamic Core Strengthening Sequences',
      'Restorative Yin Release'
    ],
    topics_te: [
      'సూర్య నమస్కారాలు A & B',
      'జంప్ త్రూ & జంప్ బ్యాక్ టెక్నిక్',
      'ఆర్మ్ బ్యాలెన్స్ & ఇన్వర్షన్ ప్రిపరేషన్',
      'డైనమిక్ కోర్ స్ట్రెంథనింగ్ సీక్వెన్సెస్',
      'యిన్ యోగా రిలాక్సేషన్'
    ],
    whatYouWillLearn: [
      'Master arm balances (Crow pose, Side plank, Forearm stand)',
      'Burn calories efficiently while toning major muscle groups',
      'Build cardiovascular stamina with continuous breath-movement flows',
      'Strengthen mental endurance and physical discipline'
    ],
    whatYouWillLearn_te: [
      'ఆర్మ్ బ్యాలెన్స్‌లను నేర్చుకోండి',
      'కండరాలను టోన్ చేస్తూ కేలరీలను సమర్థవంతంగా బర్న్ చేయండి',
      'నిరంతర శ్వాస-కదలిక ప్రవాహాలతో స్టామినాను నిర్మించండి',
      'మానసిక ఓర్పు మరియు శారీరక క్రమశిక్షణను బలోపేతం చేయండి'
    ],
    isPublished: true,
    sessionsCount: 15,
    startTime: '17:30',
    meetingIdPrefix: '543210'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for course seeding...');

    for (const cData of coursesData) {
      // Upsert Course
      let course = await Course.findOne({ slug: cData.slug });
      if (course) {
        Object.assign(course, cData);
        await course.save();
        console.log(`Updated course: ${cData.title}`);
      } else {
        course = await Course.create(cData);
        console.log(`Created course: ${cData.title}`);
      }

      // Remove existing classes for this course to ensure clean schedule
      await Class.deleteMany({ courseId: course._id });

      // Generate 15 session dates spanning the 1 month window (Mon, Wed, Fri + selected days)
      const startDate = new Date(cData.startDate);
      let sessionIndex = 1;
      let curDate = new Date(startDate);

      for (let dayOffset = 0; dayOffset < 30 && sessionIndex <= cData.sessionsCount; dayOffset++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + dayOffset);
        
        // Skip Sundays
        if (checkDate.getDay() === 0) continue;

        // Alternate days (e.g. Mon, Tue, Wed, Thu, Fri, Sat)
        const dateStr = checkDate.toISOString().split('T')[0];
        const meetingId = `${cData.meetingIdPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
        const zoomPass = 'sdf' + Math.floor(100 + Math.random() * 900);
        const zoomLink = `https://zoom.us/j/${meetingId}?pwd=${zoomPass}`;

        await Class.create({
          title: `${course.title} - Session ${sessionIndex}: ${course.topics[(sessionIndex - 1) % course.topics.length]}`,
          courseId: course._id,
          date: checkDate,
          time: cData.startTime,
          durationMinutes: 60,
          isRecurring: false,
          zoomLink: zoomLink,
          zoomMeetingId: meetingId
        });

        // Add sample completed materials for first 2 sessions
        if (sessionIndex <= 2) {
          const matType = sessionIndex === 1 ? 'Recording' : 'PDF';
          const sampleDriveLink = sessionIndex === 1
            ? 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview'
            : 'https://drive.google.com/file/d/1uD_f3h61vV3a9tC5HqYm0zQ9Xg6g8K8K/preview';

          await Material.create({
            courseId: course._id,
            date: checkDate,
            topicsCovered: `${course.title} - Session ${sessionIndex} Notes & Recording`,
            driveLink: sampleDriveLink,
            materialType: matType
          });
        }

        sessionIndex++;
      }

      console.log(`Generated ${sessionIndex - 1} classes with Zoom links for: ${course.title}`);
    }

    console.log('\n✅ Successfully added 5 complete courses with 1-month duration and full Zoom meeting schedules!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
