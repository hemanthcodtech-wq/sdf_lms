import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: {
    home: 'Home',
    courses: 'Courses',
    myLearning: 'My Learning',
    wishlist: 'Wishlist',
    profile: 'Profile',
    exploreCourses: 'Explore Courses',
    continueLearning: 'Continue Learning',
    featuredCourses: 'Featured Courses',
    upcomingClasses: 'Upcoming Live Classes',
    joinClass: 'Join Live Class',
    enrollNow: 'Enroll Now',
    startLearning: 'Start Learning',
    viewDetails: 'View Details',
    curriculum: 'Curriculum',
    instructor: 'Instructor',
    duration: 'Duration',
    language: 'Language',
    price: 'Price',
    free: 'Free',
    searchCourses: 'Search courses, topics...',
    allCategories: 'All',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    settings: 'Settings',
    certificates: 'Certificates',
    paymentHistory: 'Payment History',
    helpSupport: 'Help & Support',
    noCoursesFound: 'No courses found',
    noEnrolledCourses: 'You have not enrolled in any courses yet.',
  },
  te: {
    home: 'హోమ్',
    courses: 'కోర్సులు',
    myLearning: 'నా అభ్యాసం',
    wishlist: 'కోరికల జాబితా',
    profile: 'ప్రొఫైల్',
    exploreCourses: 'కోర్సులను అన్వేషించండి',
    continueLearning: 'అభ్యాసాన్ని కొనసాగించండి',
    featuredCourses: 'ఫీచర్డ్ కోర్సులు',
    upcomingClasses: 'రాబోయే ప్రత్యక్ష తరగతులు',
    joinClass: 'తరగతిలో చేరండి',
    enrollNow: 'ఇప్పుడే చేరండి',
    startLearning: 'నేర్చుకోవడం ప్రారంభించండి',
    viewDetails: 'వివరాలను వీక్షించండి',
    curriculum: 'పాఠ్యాంశాలు',
    instructor: 'బోధకుడు',
    duration: 'వ్యవధి',
    language: 'భాష',
    price: 'ధర',
    free: 'ఉచితం',
    searchCourses: 'కోర్సులను వెతకండి...',
    allCategories: 'అన్ని',
    login: 'లాగిన్',
    register: 'నమోదు చేయండి',
    logout: 'లాగౌట్',
    settings: 'సెట్టింగ్‌లు',
    certificates: 'సర్టిఫికెట్లు',
    paymentHistory: 'చెల్లింపు చరిత్ర',
    helpSupport: 'సహాయం & మద్దతు',
    noCoursesFound: 'కోర్సులు కనుగొనబడలేదు',
    noEnrolledCourses: 'మీరు ఇంకా ఏ కోర్సులోనూ నమోదు చేసుకోలేదు.',
  },
  hi: {
    home: 'होम',
    courses: 'पाठ्यक्रम',
    myLearning: 'मेरी सीख',
    wishlist: 'इच्छा सूची',
    profile: 'प्रोफ़ाइल',
    exploreCourses: 'पाठ्यक्रम खोजें',
    continueLearning: 'सीखना जारी रखें',
    featuredCourses: 'विशेष पाठ्यक्रम',
    upcomingClasses: 'आगामी लाइव कक्षाएं',
    joinClass: 'कक्षा में शामिल हों',
    enrollNow: 'अभी दाखिला लें',
    startLearning: 'सीखना शुरू करें',
    viewDetails: 'विवरण देखें',
    curriculum: 'पाठ्यक्रम विवरण',
    instructor: 'प्रशिक्षक',
    duration: 'अवधि',
    language: 'भाषा',
    price: 'मूल्य',
    free: 'निःशुल्क',
    searchCourses: 'पाठ्यक्रम खोजें...',
    allCategories: 'सभी',
    login: 'लॉग इन',
    register: 'साइन अप',
    logout: 'लॉग आउट',
    settings: 'सेटिंग्स',
    certificates: 'प्रमाण पत्र',
    paymentHistory: 'भुगतान इतिहास',
    helpSupport: 'सहायता एवं समर्थन',
    noCoursesFound: 'कोई पाठ्यक्रम नहीं मिला',
    noEnrolledCourses: 'आपने अभी तक किसी पाठ्यक्रम में दाखिला नहीं लिया है।',
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
