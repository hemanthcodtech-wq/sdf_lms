import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: {
    // Navigation Tabs
    home: 'Home',
    courses: 'Courses',
    myLearning: 'My Learning',
    wishlist: 'Wishlist',
    profile: 'Profile',

    // Header & Greeting
    welcomeBack: 'Welcome back,',
    guestLearner: 'Guest Learner',
    searchCourses: 'Search courses, topics...',

    // Hero Banner
    discoverExcellence: 'DISCOVER EXCELLENCE',
    heroTitle: 'Master Ancient Wisdom & Modern Skills',
    heroSub: 'Join interactive live sessions with verified master mentors.',
    browseCourses: 'Browse Courses',

    // Section Titles
    featuredCourses: 'Featured Courses',
    upcomingClasses: 'Upcoming Live Classes',
    continueLearning: 'Continue Learning',
    categories: 'Categories',
    popularMentorships: 'Popular Mentorships',
    viewAll: 'View All',
    seeAll: 'See All',
    allCategories: 'All',

    // Live Classes
    joinClass: 'Join Live Class',
    liveNow: 'LIVE NOW',
    scheduled: 'SCHEDULED',
    starts2mBefore: 'Starts 2m Before',
    today: 'Today',
    tomorrow: 'Tomorrow',
    liveBatch: 'Live Batch',
    liveSessionScheduled: 'Live Session Scheduled',

    // Course Card & Details
    enrollNow: 'Enroll Now',
    startLearning: 'Start Learning',
    viewDetails: 'View Details',
    curriculum: 'Curriculum',
    instructor: 'Instructor',
    expertFaculty: 'Expert Faculty',
    duration: 'Duration',
    language: 'Language',
    price: 'Price',
    free: 'Free',
    paid: 'Paid',
    level: 'Level',
    completed: 'Completed',
    selfPaced: 'Self-Paced',
    months: 'Months',
    access: 'Access',
    validity: 'Validity',
    noCoursesFound: 'No courses found',

    // My Learning
    ongoingCourses: 'Ongoing Courses',
    completedCourses: 'Completed Courses',
    noEnrolledCourses: 'You have not enrolled in any courses yet.',
    noCompletedCourses: 'No Completed Courses Yet',
    keepLearningDesc: 'Keep learning to complete your modules and unlock certificates.',
    exploreCatalogDesc: 'Explore our catalog to start your learning journey with world-class faculty.',
    exploreCourses: 'Explore Courses',

    // Wishlist
    myWishlist: 'My Wishlist',
    wishlistEmptyTitle: 'Your Wishlist is Empty',
    wishlistEmptyDesc: 'Explore courses and tap the heart icon to save courses you want to learn later.',
    coursesSaved: 'courses saved',
    courseSaved: 'course saved',

    // Profile Screen
    myEnrollments: 'My Enrollments',
    myCertificates: 'My Certificates',
    certificates: 'Certificates',
    paymentHistory: 'Payment History',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    studentDetails: 'Student Details',
    legalName: 'Full Legal Name',
    emailAddress: 'Active Email',
    phoneNumber: 'Phone Number',
    editProfile: 'Edit Profile Details',
    edit: 'Edit',
    tapAvatarChange: 'Tap avatar to change photo',
    savedCoursesSubtitle: 'saved courses',
    activeCoursesSubtitle: 'active courses',
    transactionsSubtitle: 'transactions',
    certificatesEarned: 'certificates earned',
    appPreferencesSubtitle: 'App preferences & language selection',
    helpSupportSubtitle: 'FAQ, contact info & direct guidance',
    signInPrompt: 'Sign in to access all courses & dashboard',
    loginSignUp: 'Login / Sign Up',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',

    // Settings & Policies
    appLanguage: 'App Language',
    aboutLegal: 'About & Legal',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    refundPolicy: 'Refund & Cancellation Policy',

    // Notifications
    notifications: 'Notifications',
    clearAll: 'Clear All',
    noNotifications: 'No notifications yet',
    noNotificationsSub: 'Class reminders and updates will appear here.',
    swipeToDismiss: 'Swipe to clear ↔',
    joinZoomNow: 'Join Live Zoom (Starting Now)',
    openZoom: 'Open Zoom Link',
  },

  te: {
    // Navigation Tabs
    home: 'హోమ్',
    courses: 'కోర్సులు',
    myLearning: 'నా అభ్యాసం',
    wishlist: 'కోరికల జాబితా',
    profile: 'ప్రొఫైల్',

    // Header & Greeting
    welcomeBack: 'తిరిగి స్వాగతం,',
    guestLearner: 'అతిథి అభ్యాసకుడు',
    searchCourses: 'కోర్సులను వెతకండి...',

    // Hero Banner
    discoverExcellence: 'శ్రేష్టతను కనుగొనండి',
    heroTitle: 'పురాతన జ్ఞానం & ఆధునిక నైపుణ్యాలను నేర్చుకోండి',
    heroSub: 'ధృవీకరించబడిన నిపుణులైన గురువులతో ప్రత్యక్ష తరగతుల్లో చేరండి.',
    browseCourses: 'కోర్సులను బ్రౌజ్ చేయండి',

    // Section Titles
    featuredCourses: 'ఫీచర్డ్ కోర్సులు',
    upcomingClasses: 'రాబోయే ప్రత్యక్ష తరగతులు',
    continueLearning: 'అభ్యాసాన్ని కొనసాగించండి',
    categories: 'వర్గాలు',
    popularMentorships: 'ప్రసిద్ధ కోర్సులు',
    viewAll: 'అన్నీ చూడండి',
    seeAll: 'అన్నీ చూడండి',
    allCategories: 'అన్ని',

    // Live Classes
    joinClass: 'తరగతిలో చేరండి',
    liveNow: 'లైవ్ నడుస్తోంది',
    scheduled: 'షెడ్యూల్ చేయబడింది',
    starts2mBefore: '2 నిమిషాల ముందు ప్రారంభం',
    today: 'ఈరోజు',
    tomorrow: 'రేపు',
    liveBatch: 'లైవ్ బ్యాచ్',
    liveSessionScheduled: 'ప్రత్యక్ష సెషన్ షెడ్యూల్ చేయబడింది',

    // Course Card & Details
    enrollNow: 'ఇప్పుడే చేరండి',
    startLearning: 'నేర్చుకోవడం ప్రారంభించండి',
    viewDetails: 'వివరాలను వీక్షించండి',
    curriculum: 'పాఠ్యాంశాలు',
    instructor: 'బోధకుడు',
    expertFaculty: 'నిపుణులైన అధ్యాపకులు',
    duration: 'వ్యవధి',
    language: 'భాష',
    price: 'ధర',
    free: 'ఉచితం',
    paid: 'చెల్లించినవి',
    level: 'స్థాయి',
    completed: 'పూర్తయింది',
    selfPaced: 'స్వయం అభ్యాసం',
    months: 'నెలలు',
    access: 'యాక్సెస్',
    validity: 'వ్యవధి',
    noCoursesFound: 'కోర్సులు కనుగొనబడలేదు',

    // My Learning
    ongoingCourses: 'కొనసాగుతున్న కోర్సులు',
    completedCourses: 'పూర్తయిన కోర్సులు',
    noEnrolledCourses: 'మీరు ఇంకా ఏ కోర్సులోనూ నమోదు చేసుకోలేదు.',
    noCompletedCourses: 'ఇంకా పూర్తయిన కోర్సులు లేవు',
    keepLearningDesc: 'మీ మాడ్యూల్స్‌ను పూర్తి చేసి సర్టిఫికెట్లను అన్‌లాక్ చేయడానికి అభ్యాసాన్ని కొనసాగించండి.',
    exploreCatalogDesc: 'ప్రపంచ స్థాయి అధ్యాపకులతో మీ అభ్యాస ప్రయాణాన్ని ప్రారంభించడానికి కోర్సులను అన్వేషించండి.',
    exploreCourses: 'కోర్సులను అన్వేషించండి',

    // Wishlist
    myWishlist: 'నా కోరికల జాబితా',
    wishlistEmptyTitle: 'మీ కోరికల జాబితా ఖాళీగా ఉంది',
    wishlistEmptyDesc: 'కోర్సులను అన్వేషించండి మరియు మీరు తర్వాత నేర్చుకోవాలనుకుంటున్న కోర్సులను సేవ్ చేయడానికి హార్ట్ ఐకాన్‌ను నొక్కండి.',
    coursesSaved: 'కోర్సులు సేవ్ చేయబడ్డాయి',
    courseSaved: 'కోర్సు సేవ్ చేయబడింది',

    // Profile Screen
    myEnrollments: 'నా కోర్సులు',
    myCertificates: 'నా సర్టిఫికెట్లు',
    certificates: 'సర్టిఫికెట్లు',
    paymentHistory: 'చెల్లింపు చరిత్ర',
    settings: 'సెట్టింగ్‌లు',
    helpSupport: 'సహాయం & మద్దతు',
    studentDetails: 'విద్యార్థి వివరాలు',
    legalName: 'పూర్తి చట్టబద్ధమైన పేరు',
    emailAddress: 'సక్రియ ఇమెయిల్',
    phoneNumber: 'ఫోన్ నంబర్',
    editProfile: 'ప్రొఫైల్ వివరాలను సవరించండి',
    edit: 'సవరించు',
    tapAvatarChange: 'ఫోటో మార్చడానికి అవతార్‌పై నొక్కండి',
    savedCoursesSubtitle: 'సేవ్ చేసిన కోర్సులు',
    activeCoursesSubtitle: 'యాక్టివ్ కోర్సులు',
    transactionsSubtitle: 'లావాదేవీలు',
    certificatesEarned: 'సాధించిన సర్టిఫికెట్లు',
    appPreferencesSubtitle: 'యాప్ ప్రాధాన్యతలు & భాష ఎంపిక',
    helpSupportSubtitle: 'తరచుగా అడిగే ప్రశ్నలు, సంప్రదింపు సమాచారం & మార్గదర్శకత్వం',
    signInPrompt: 'అన్ని కోర్సులు & డ్యాష్‌బోర్డ్‌ను యాక్సెస్ చేయడానికి సైన్ ఇన్ చేయండి',
    loginSignUp: 'లాగిన్ / నమోదు చేయండి',
    login: 'లాగిన్',
    register: 'నమోదు చేయండి',
    logout: 'లాగౌట్',

    // Settings & Policies
    appLanguage: 'యాప్ భాష',
    aboutLegal: 'గురించి & చట్టపరమైన',
    termsConditions: 'నిబంధనలు & షరతులు',
    privacyPolicy: 'గోప్యతా విధానం',
    refundPolicy: 'రీఫండ్ & రద్దు విధానం',

    // Notifications
    notifications: 'నోటిఫికేషన్‌లు',
    clearAll: 'అన్నీ తొలగించు',
    noNotifications: 'ఇంకా నోటిఫికేషన్‌లు లేవు',
    noNotificationsSub: 'తరగతి రిమైండర్‌లు మరియు అప్‌డేట్‌లు ఇక్కడ కనిపిస్తాయి.',
    swipeToDismiss: 'తొలగించడానికి స్వైప్ చేయండి ↔',
    joinZoomNow: 'లైవ్ జూమ్‌లో చేరండి (ఇప్పుడే ప్రారంభం)',
    openZoom: 'జూమ్ లింక్ తెరవండి',
  },

  hi: {
    // Navigation Tabs
    home: 'होम',
    courses: 'पाठ्यक्रम',
    myLearning: 'मेरी सीख',
    wishlist: 'इच्छा सूची',
    profile: 'प्रोफ़ाइल',

    // Header & Greeting
    welcomeBack: 'वापसी पर स्वागत है,',
    guestLearner: 'अतिथि शिक्षार्थी',
    searchCourses: 'पाठ्यक्रम खोजें...',

    // Hero Banner
    discoverExcellence: 'उत्कृष्टता की खोज करें',
    heroTitle: 'प्राचीन ज्ञान और आधुनिक कौशल में महारत हासिल करें',
    heroSub: 'सत्यापित विशेषज्ञ आचार्यों के साथ लाइव कक्षाओं में शामिल हों।',
    browseCourses: 'पाठ्यक्रम देखें',

    // Section Titles
    featuredCourses: 'विशेष पाठ्यक्रम',
    upcomingClasses: 'आगामी लाइव कक्षाएं',
    continueLearning: 'सीखना जारी रखें',
    categories: 'श्रेणियाँ',
    popularMentorships: 'लोकप्रिय मार्गदर्शन',
    viewAll: 'सभी देखें',
    seeAll: 'सभी देखें',
    allCategories: 'सभी',

    // Live Classes
    joinClass: 'कक्षा में शामिल हों',
    liveNow: 'लाइव चालू है',
    scheduled: 'शेड्यूल किया गया',
    starts2mBefore: '2 मिनट पहले शुरू',
    today: 'आज',
    tomorrow: 'कल',
    liveBatch: 'लाइव बैच',
    liveSessionScheduled: 'लाइव सत्र निर्धारित है',

    // Course Card & Details
    enrollNow: 'अभी दाखिला लें',
    startLearning: 'सीखना शुरू करें',
    viewDetails: 'विवरण देखें',
    curriculum: 'पाठ्यक्रम विवरण',
    instructor: 'प्रशिक्षक',
    expertFaculty: 'विशेषज्ञ संकाय',
    duration: 'अवधि',
    language: 'भाषा',
    price: 'मूल्य',
    free: 'निःशुल्क',
    paid: 'भुगतान किया गया',
    level: 'स्तर',
    completed: 'पूर्ण',
    selfPaced: 'स्व-गति',
    months: 'महीने',
    access: 'पहुंच',
    validity: 'वैधता',
    noCoursesFound: 'कोई पाठ्यक्रम नहीं मिला',

    // My Learning
    ongoingCourses: 'चल रहे पाठ्यक्रम',
    completedCourses: 'पूर्ण पाठ्यक्रम',
    noEnrolledCourses: 'आपने अभी तक किसी पाठ्यक्रम में दाखिला नहीं लिया है।',
    noCompletedCourses: 'अभी तक कोई पूर्ण पाठ्यक्रम नहीं',
    keepLearningDesc: 'अपने मॉड्यूल पूरे करने और प्रमाण पत्र प्राप्त करने के लिए सीखते रहें।',
    exploreCatalogDesc: 'विश्वस्तरीय शिक्षकों के साथ अपनी सीखने की यात्रा शुरू करने के लिए पाठ्यक्रम खोजें।',
    exploreCourses: 'पाठ्यक्रम खोजें',

    // Wishlist
    myWishlist: 'मेरी इच्छा सूची',
    wishlistEmptyTitle: 'आपकी इच्छा सूची खाली है',
    wishlistEmptyDesc: 'पाठ्यक्रम खोजें और बाद में सीखने के लिए दिल के आइकन पर टैप करके सेव करें।',
    coursesSaved: 'पाठ्यक्रम सहेजे गए',
    courseSaved: 'पाठ्यक्रम सहेजा गया',

    // Profile Screen
    myEnrollments: 'मेरे नामांकन',
    myCertificates: 'मेरे प्रमाण पत्र',
    certificates: 'प्रमाण पत्र',
    paymentHistory: 'भुगतान इतिहास',
    settings: 'सेटिंग्स',
    helpSupport: 'सहायता एवं समर्थन',
    studentDetails: 'छात्र विवरण',
    legalName: 'पूरा कानूनी नाम',
    emailAddress: 'सक्रिय ईमेल',
    phoneNumber: 'फ़ोन नंबर',
    editProfile: 'प्रोफ़ाइल विवरण संपादित करें',
    edit: 'संपादित करें',
    tapAvatarChange: 'फ़ोटो बदलने के लिए अवतार पर टैप करें',
    savedCoursesSubtitle: 'सहेजे गए पाठ्यक्रम',
    activeCoursesSubtitle: 'सक्रिय पाठ्यक्रम',
    transactionsSubtitle: 'लेन-देन',
    certificatesEarned: 'अर्जित प्रमाण पत्र',
    appPreferencesSubtitle: 'ऐप प्राथमिकताएं और भाषा चयन',
    helpSupportSubtitle: 'अक्सर पूछे जाने वाले प्रश्न, संपर्क जानकारी और मार्गदर्शन',
    signInPrompt: 'सभी पाठ्यक्रमों और डैशबोर्ड तक पहुंचने के लिए साइन इन करें',
    loginSignUp: 'लॉग इन / साइन अप',
    login: 'लॉग इन',
    register: 'साइन अप',
    logout: 'लॉग आउट',

    // Settings & Policies
    appLanguage: 'ऐप की भाषा',
    aboutLegal: 'के बारे में और कानूनी',
    termsConditions: 'नियम और शर्तें',
    privacyPolicy: 'गोपनीयता नीति',
    refundPolicy: 'धनवापसी और रद्दीकरण नीति',

    // Notifications
    notifications: 'सूचनाएं',
    clearAll: 'सभी साफ़ करें',
    noNotifications: 'अभी तक कोई सूचना नहीं',
    noNotificationsSub: 'कक्षा के रिमाइंडर और अपडेट यहां दिखाई देंगे।',
    swipeToDismiss: 'साफ़ करने के लिए स्वाइप करें ↔',
    joinZoomNow: 'लाइव ज़ूम में शामिल हों (अभी शुरू)',
    openZoom: 'ज़ूम लिंक खोलें',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('selectedLanguage').then((saved) => {
      if (saved && translations[saved]) {
        setLang(saved);
      }
    });
  }, []);

  const changeLanguage = async (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      await AsyncStorage.setItem('selectedLanguage', newLang);
    }
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
