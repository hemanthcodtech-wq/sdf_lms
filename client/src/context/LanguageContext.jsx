import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Navbar
    nav_home: 'Home',
    nav_about: 'About',
    nav_courses: 'Courses',
    nav_contact: 'Contact',
    nav_login: 'Log in',
    nav_register: 'Register',
    nav_dashboard: 'Dashboard',
    nav_bottom_home: 'Home',
    nav_bottom_classes: 'Classes',
    nav_bottom_about: 'About',
    nav_bottom_login: 'Login',

    // Hero
    hero_title_1: 'Future of',
    hero_title_2: 'Wellness Learning',
    hero_subtitle: "Master new skills in a premium, immersive environment. Join the Swamy Dwija Foundation's community of visionaries.",
    hero_explore: 'Explore Courses',
    hero_start: 'Start Learning',

    // Stats
    stat_students: 'Students',
    stat_courses: 'Courses',
    stat_instructors: 'Instructors',
    stat_satisfaction: 'Satisfaction',

    // Featured Courses
    featured_title: 'Featured Courses',
    featured_sub: 'Discover our most popular wellness programs',
    featured_view_all: 'View All',
    featured_book_now: 'Book now',

    // About
    about_title: 'About SDF',
    about_subtitle: 'The Swamy Dwija Foundation is dedicated to disseminating ancient Indian wisdom and holistic wellness practices to the modern world.',
    mission_title: 'Our Mission',
    mission_p1: 'We believe that true wellness encompasses the mind, body, and spirit. Our mission is to provide accessible, high-quality education in Yoga, Meditation, Nutrition, and Ayurveda.',
    mission_p2: 'By blending traditional knowledge with contemporary scientific understanding, we empower individuals to take control of their health and well-being.',
    vision_title: 'Our Vision',
    vision_p1: 'We envision a world where ancient Indian wisdom and holistic wellness are accessible to every individual — regardless of geography, background, or ability. A world where self-healing, mindfulness, and preventive health are woven into the fabric of everyday life.',
    vision_p2: 'Through technology, compassion, and a deep reverence for tradition, the Swamy Dwija Foundation aspires to be a global beacon of transformation — nurturing generations of conscious, healthy, and empowered human beings.',
    val_authenticity: 'Authenticity',
    val_authenticity_desc: 'We stay true to the ancient texts while making them relevant for today\'s lifestyle.',
    val_community: 'Community',
    val_community_desc: 'We foster a supportive environment where students grow together.',
    val_excellence: 'Excellence',
    val_excellence_desc: 'Our instructors are dedicated practitioners with profound theoretical knowledge.',

    // CTA
    cta_title: 'Ready to Start Learning?',
    cta_sub: 'Join thousands of students who have transformed their lives through the ancient wisdom of yoga, meditation, and Ayurveda.',
    cta_btn: 'Enroll Today',

    // Footer
    footer_desc: "Swamy Dwija Foundation Learning Management System. Start your wellness journey with our premium Yoga, Meditation, Nutrition, and Ayurveda courses.",
    footer_quick: 'Quick Links',
    footer_legal: 'Legal',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_copy: 'Swamy Dwija Foundation. All rights reserved.',
  },
  te: {
    // Navbar
    nav_home: 'హోమ్',
    nav_about: 'మా గురించి',
    nav_courses: 'కోర్సులు',
    nav_contact: 'సంప్రదించండి',
    nav_login: 'లాగిన్',
    nav_register: 'నమోదు',
    nav_dashboard: 'డాష్‌బోర్డ్',
    nav_bottom_home: 'హోమ్',
    nav_bottom_classes: 'తరగతులు',
    nav_bottom_about: 'మా గురించి',
    nav_bottom_login: 'లాగిన్',

    // Hero
    hero_title_1: 'భవిష్యత్తు',
    hero_title_2: 'ఆరోగ్య అభ్యాసం',
    hero_subtitle: 'స్వామి ద్విజ ఫౌండేషన్‌లో యోగ, ధ్యానం, పోషణ మరియు ఆయుర్వేదంలో నిపుణుడయ్యండి.',
    hero_explore: 'కోర్సులు చూడండి',
    hero_start: 'అభ్యాసం ప్రారంభించండి',

    // Stats
    stat_students: 'విద్యార్థులు',
    stat_courses: 'కోర్సులు',
    stat_instructors: 'బోధకులు',
    stat_satisfaction: 'సంతృప్తి',

    // Featured Courses
    featured_title: 'ప్రముఖ కోర్సులు',
    featured_sub: 'మా అత్యంత ప్రజాదరణ పొందిన వెల్నెస్ కార్యక్రమాలను కనుగొనండి',
    featured_view_all: 'అన్నీ చూడండి',
    featured_book_now: 'ఇప్పుడే బుక్ చేయండి',

    // About
    about_title: 'SDF గురించి',
    about_subtitle: 'స్వామి ద్విజ ఫౌండేషన్ ప్రాచీన భారతీయ జ్ఞానాన్ని మరియు సమగ్ర ఆరోగ్య పద్ధతులను ఆధునిక ప్రపంచానికి అందించడానికి అంకితమైంది.',
    mission_title: 'మా లక్ష్యం',
    mission_p1: 'నిజమైన ఆరోగ్యం మనస్సు, శరీరం మరియు ఆత్మను కలిగి ఉంటుందని మేము విశ్వసిస్తున్నాము. యోగ, ధ్యానం, పోషణ మరియు ఆయుర్వేదంలో అందుబాటులో ఉన్న, అధిక నాణ్యమైన విద్యను అందించడం మా లక్ష్యం.',
    mission_p2: 'సాంప్రదాయ జ్ఞానాన్ని సమకాలీన శాస్త్రీయ అవగాహనతో మిళితం చేయడం ద్వారా, మేము వ్యక్తులు తమ ఆరోగ్యాన్ని మరియు శ్రేయస్సును నియంత్రించుకోవడానికి శక్తినిస్తాము.',
    vision_title: 'మా దృష్టి',
    vision_p1: 'భౌగోళికం, నేపథ్యం లేదా సామర్థ్యంతో సంబంధం లేకుండా ప్రతి వ్యక్తికి ప్రాచీన భారతీయ జ్ఞానం మరియు సమగ్ర ఆరోగ్యం అందుబాటులో ఉండే ప్రపంచాన్ని మేము ఊహిస్తున్నాము.',
    vision_p2: 'సాంకేతికత, కరుణ మరియు సంప్రదాయం పట్ల లోతైన గౌరవం ద్వారా, స్వామి ద్విజ ఫౌండేషన్ ప్రపంచ మార్పు యొక్క దీపస్తంభంగా ఉండాలని ఆకాంక్షిస్తోంది.',
    val_authenticity: 'ప్రామాణికత',
    val_authenticity_desc: 'మేము ప్రాచీన గ్రంథాలకు నిజాయితీగా ఉంటూ వాటిని నేటి జీవనశైలికి అనుకూలంగా మారుస్తాము.',
    val_community: 'సమాజం',
    val_community_desc: 'విద్యార్థులు కలిసి ఎదిగే సహాయక వాతావరణాన్ని మేము పెంపొందిస్తాము.',
    val_excellence: 'శ్రేష్ఠత',
    val_excellence_desc: 'మా బోధకులు లోతైన సైద్ధాంతిక జ్ఞానంతో కూడిన అంకితభావంతో కూడిన అభ్యాసకులు.',

    // CTA
    cta_title: 'అభ్యాసం ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?',
    cta_sub: 'యోగ, ధ్యానం మరియు ఆయుర్వేదం యొక్క ప్రాచీన జ్ఞానం ద్వారా తమ జీవితాలను మార్చుకున్న వేల మంది విద్యార్థులతో చేరండి.',
    cta_btn: 'ఈరోజే నమోదు చేసుకోండి',

    // Footer
    footer_desc: 'స్వామి ద్విజ ఫౌండేషన్ లెర్నింగ్ మేనేజ్‌మెంట్ సిస్టమ్. మా ప్రీమియం యోగ, ధ్యానం, పోషణ మరియు ఆయుర్వేద కోర్సులతో మీ ఆరోగ్య ప్రయాణం ప్రారంభించండి.',
    footer_quick: 'త్వరిత లింకులు',
    footer_legal: 'చట్టపరమైనది',
    footer_privacy: 'గోప్యతా విధానం',
    footer_terms: 'సేవా నిబంధనలు',
    footer_copy: 'స్వామి ద్విజ ఫౌండేషన్. అన్ని హక్కులు మేము కలిగి ఉన్నాము.',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang][key] || translations['en'][key] || key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
