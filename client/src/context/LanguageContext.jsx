import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navbar
    nav_home: 'Home', nav_about: 'About', nav_courses: 'Courses',
    nav_contact: 'Contact', nav_login: 'Log in', nav_register: 'Register',
    nav_dashboard: 'Dashboard', nav_bottom_home: 'Home',
    nav_bottom_classes: 'Classes', nav_bottom_about: 'About', nav_bottom_login: 'Login',

    // Hero
    hero_title_1: 'Future of', hero_title_2: 'Wellness Learning',
    hero_subtitle: "Master new skills in a premium, immersive environment. Join the Swamy Dwija Foundation's community of visionaries.",
    hero_explore: 'Explore Courses', hero_start: 'Start Learning',

    // Stats
    stat_students: 'Students', stat_courses: 'Courses',
    stat_instructors: 'Instructors', stat_satisfaction: 'Satisfaction',

    // Featured Courses
    featured_title: 'Featured Courses',
    featured_sub: 'Discover our most popular wellness programs',
    featured_view_all: 'View All', featured_book_now: 'Book now',

    // About
    about_title: 'About SDF',
    about_subtitle: 'The Swamy Dwija Foundation is dedicated to disseminating ancient Indian wisdom and holistic wellness practices to the modern world.',
    mission_title: 'Our Mission',
    mission_p1: 'We believe that true wellness encompasses the mind, body, and spirit. Our mission is to provide accessible, high-quality education in Yoga, Meditation, Nutrition, and Ayurveda.',
    mission_p2: 'By blending traditional knowledge with contemporary scientific understanding, we empower individuals to take control of their health and well-being.',
    vision_title: 'Our Vision',
    vision_p1: 'We envision a world where ancient Indian wisdom and holistic wellness are accessible to every individual — regardless of geography, background, or ability.',
    vision_p2: 'Through technology, compassion, and a deep reverence for tradition, the Swamy Dwija Foundation aspires to be a global beacon of transformation.',
    val_authenticity: 'Authenticity',
    val_authenticity_desc: "We stay true to the ancient texts while making them relevant for today's lifestyle.",
    val_community: 'Community',
    val_community_desc: 'We foster a supportive environment where students grow together.',
    val_excellence: 'Excellence',
    val_excellence_desc: 'Our instructors are dedicated practitioners with profound theoretical knowledge.',

    // Contact
    contact_title: 'Get In Touch',
    contact_subtitle: "We'd love to hear from you. Drop us a message!",
    contact_info: 'Contact Information',
    contact_call: 'Call Us', contact_email_us: 'Email Us',
    contact_location_label: 'Location',
    contact_location_val: '123 Wellness Avenue, Bangalore, India',
    contact_send_title: 'Send us a Message',
    contact_name: 'Your Name', contact_email_label: 'Your Email',
    contact_message: 'Message', contact_send_btn: 'Send Message',

    // Login
    login_welcome: 'Welcome back!',
    login_subtitle: 'Login to manage your learning & courses',
    login_email_placeholder: 'Email or Phone Number',
    login_password_placeholder: 'Enter your password',
    login_password: 'Password', login_forgot: 'Forgot password?',
    login_trouble: 'Having trouble logging in?',
    login_btn: 'Login', login_loading: 'Logging in...',
    login_no_account: 'Need to create an account?',
    login_signup: 'Sign UP', login_or: 'OR',
    login_google: 'Log in using Google', login_google_loading: 'Signing in...',
    login_apple: 'Sign in with Apple',

    // Register
    register_join: 'Join Us!', register_title: 'Create an Account',
    register_email: 'Email or Phone Number',
    register_password: 'Password', register_confirm: 'Confirm Password',
    register_btn: 'Sign Up', register_loading: 'Signing up...',
    register_have_account: 'Already have an account?', register_login_link: 'Login',

    // Courses
    course_details: 'Class Details', course_about: 'About This Class',
    course_learn: 'What You Will Learn', course_enroll: 'Enroll Now',
    course_ready: 'Ready to start?', course_join_thousands: 'Join thousands of students',
    course_access: 'Access', course_lifetime: 'Lifetime',
    course_format: 'Format', course_ondemand: 'On-demand',
    course_all: 'All Classes',
    course_discover: 'Discover a wide range of courses taught by expert instructors.',
    course_search: 'Search classes...', course_no_found: 'No classes found',
    course_no_found_sub: 'Try adjusting your search or category filter.',

    // Home - Categories
    home_categories_title: 'Explore by Category',
    home_categories_sub: 'Find the perfect path for your wellness journey from our diverse range of subjects.',
    home_cat_view: 'View Courses',
    home_trusted: 'Trusted by industry leaders worldwide',
    // Home - How it works
    home_how_title: "How You'll Learn",
    home_how_sub: 'Our platform is designed to provide a seamless, intuitive, and deeply engaging learning experience.',
    home_step1_title: 'Select a Program', home_step1_desc: 'Browse our extensive catalog and find the course that resonates with your goals.',
    home_step2_title: 'Learn at Your Pace', home_step2_desc: 'Access high-quality video lectures, reading materials, and interactive quizzes anytime.',
    home_step3_title: 'Earn Certification', home_step3_desc: 'Complete the curriculum and receive a globally recognized certificate of completion.',
    home_completed: 'Completed', home_lessons: '100+ Lessons',
    // Home - Why choose us
    home_why_title: 'Why Choose SDF?',
    home_why1_title: 'Expert Gurus', home_why1_desc: 'Learn from highly qualified practitioners with decades of experience in ancient wellness traditions.',
    home_why2_title: 'Learn Anywhere', home_why2_desc: 'Access high-quality courses on any device, at your own pace, from anywhere in the world.',
    home_why3_title: 'Certified Learning', home_why3_desc: 'Earn recognized certificates upon course completion to validate your skills and knowledge.',
    // Home - CTA
    home_cta_title: 'Ready to Start Learning?',
    home_cta_sub: 'Join thousands of students already learning with us. Start your journey today!',
    home_cta_btn: 'Get Started Now',
    home_view_all_mobile: 'View All Courses',

    // CTA
    cta_title: 'Ready to Start Learning?',
    cta_sub: 'Join thousands of students who have transformed their lives through the ancient wisdom of yoga, meditation, and Ayurveda.',
    cta_btn: 'Enroll Today',

    // Footer
    footer_desc: "Swamy Dwija Foundation Learning Management System. Start your wellness journey with our premium Yoga, Meditation, Nutrition, and Ayurveda courses.",
    footer_quick: 'Quick Links', footer_legal: 'Legal',
    footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_copy: 'Swamy Dwija Foundation. All rights reserved.',

    // Dashboard Nav
    dash_nav_home: 'Home',
    dash_nav_courses: 'Courses',
    dash_nav_classes: 'Classes',
    dash_nav_learning: 'My Learning',
    dash_nav_profile: 'Profile',
  },

  te: {
    // Navbar
    nav_home: 'హోమ్', nav_about: 'మా గురించి', nav_courses: 'కోర్సులు',
    nav_contact: 'సంప్రదించండి', nav_login: 'లాగిన్', nav_register: 'నమోదు',
    nav_dashboard: 'డాష్‌బోర్డ్', nav_bottom_home: 'హోమ్',
    nav_bottom_classes: 'తరగతులు', nav_bottom_about: 'మా గురించి', nav_bottom_login: 'లాగిన్',

    // Hero
    hero_title_1: 'భవిష్యత్తు', hero_title_2: 'ఆరోగ్య అభ్యాసం',
    hero_subtitle: 'స్వామి ద్విజ ఫౌండేషన్‌లో యోగ, ధ్యానం, పోషణ మరియు ఆయుర్వేదంలో నిపుణుడయ్యండి.',
    hero_explore: 'కోర్సులు చూడండి', hero_start: 'అభ్యాసం ప్రారంభించండి',

    // Stats
    stat_students: 'విద్యార్థులు', stat_courses: 'కోర్సులు',
    stat_instructors: 'బోధకులు', stat_satisfaction: 'సంతృప్తి',

    // Featured Courses
    featured_title: 'ప్రముఖ కోర్సులు',
    featured_sub: 'మా అత్యంత ప్రజాదరణ పొందిన వెల్నెస్ కార్యక్రమాలను కనుగొనండి',
    featured_view_all: 'అన్నీ చూడండి', featured_book_now: 'ఇప్పుడే బుక్ చేయండి',

    // About
    about_title: 'SDF గురించి',
    about_subtitle: 'స్వామి ద్విజ ఫౌండేషన్ ప్రాచీన భారతీయ జ్ఞానాన్ని మరియు సమగ్ర ఆరోగ్య పద్ధతులను ఆధునిక ప్రపంచానికి అందించడానికి అంకితమైంది.',
    mission_title: 'మా లక్ష్యం',
    mission_p1: 'నిజమైన ఆరోగ్యం మనస్సు, శరీరం మరియు ఆత్మను కలిగి ఉంటుందని మేము విశ్వసిస్తున్నాము. యోగ, ధ్యానం, పోషణ మరియు ఆయుర్వేదంలో అందుబాటులో ఉన్న అధిక నాణ్యమైన విద్యను అందించడం మా లక్ష్యం.',
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

    // Contact
    contact_title: 'సంప్రదించండి',
    contact_subtitle: 'మీరు చెప్పేది వినడానికి ఇష్టపడతాము. మాకు సందేశం పంపండి!',
    contact_info: 'సంప్రదింపు సమాచారం',
    contact_call: 'కాల్ చేయండి', contact_email_us: 'ఇమెయిల్ చేయండి',
    contact_location_label: 'స్థానం',
    contact_location_val: '123 వెల్నెస్ అవెన్యూ, బెంగళూరు, భారతదేశం',
    contact_send_title: 'మాకు సందేశం పంపండి',
    contact_name: 'మీ పేరు', contact_email_label: 'మీ ఇమెయిల్',
    contact_message: 'సందేశం', contact_send_btn: 'సందేశం పంపండి',

    // Login
    login_welcome: 'తిరిగి స్వాగతం!',
    login_subtitle: 'మీ అభ్యాసం & కోర్సులను నిర్వహించడానికి లాగిన్ చేయండి',
    login_email_placeholder: 'ఇమెయిల్ లేదా ఫోన్ నంబర్',
    login_password_placeholder: 'పాస్‌వర్డ్ నమోదు చేయండి',
    login_password: 'పాస్వర్డ్', login_forgot: 'పాస్వర్డ్ మర్చిపోయారా?',
    login_trouble: 'లాగిన్ చేయడంలో సమస్య ఉందా?',
    login_btn: 'లాగిన్', login_loading: 'లాగిన్ అవుతోంది...',
    login_no_account: 'ఖాతా సృష్టించాలా?',
    login_signup: 'నమోదు చేసుకోండి', login_or: 'లేదా',
    login_google: 'గూగుల్‌తో లాగిన్ చేయండి', login_google_loading: 'లాగిన్ అవుతోంది...',
    login_apple: 'Apple తో లాగిన్ చేయండి',

    // Register
    register_join: 'మాతో చేరండి!', register_title: 'ఖాతా సృష్టించండి',
    register_email: 'ఇమెయిల్ లేదా ఫోన్ నంబర్',
    register_password: 'పాస్వర్డ్', register_confirm: 'పాస్వర్డ్ నిర్ధారించండి',
    register_btn: 'నమోదు చేసుకోండి', register_loading: 'నమోదు అవుతోంది...',
    register_have_account: 'ఇప్పటికే ఖాతా ఉందా?', register_login_link: 'లాగిన్',

    // Courses
    course_details: 'తరగతి వివరాలు', course_about: 'ఈ తరగతి గురించి',
    course_learn: 'మీరు నేర్చుకునేది', course_enroll: 'ఇప్పుడే చేరండి',
    course_ready: 'ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?',
    course_join_thousands: 'వేల మంది విద్యార్థులతో చేరండి',
    course_access: 'యాక్సెస్', course_lifetime: 'జీవితకాలం',
    course_format: 'ఫార్మాట్', course_ondemand: 'అవసరమైనప్పుడు',
    course_all: 'అన్ని తరగతులు',
    course_discover: 'నిపుణ బోధకులు బోధించే అనేక కోర్సులను కనుగొనండి.',
    course_search: 'తరగతులు వెతకండి...', course_no_found: 'తరగతులు కనుగొనబడలేదు',
    course_no_found_sub: 'మీ శోధన లేదా వర్గ ఫిల్టర్‌ను సర్దుబాటు చేయండి.',

    // Home - Categories
    home_categories_title: 'వర్గం వారీగా అన్వేషించండి',
    home_categories_sub: 'మీ ఆరోగ్య ప్రయాణానికి సరైన మార్గాన్ని మా విభిన్న విషయాల నుండి కనుగొనండి.',
    home_cat_view: 'కోర్సులు చూడండి',
    home_trusted: 'పరిశ్రమ నేతలు ప్రపంచవ్యాప్తంగా నమ్మినవారు',
    // Home - How it works
    home_how_title: 'మీరు ఎలా నేర్చుకుంటారు',
    home_how_sub: 'మా ప్లాట్‌ఫారమ్ అతుకులేని, సహజమైన మరియు లోతుగా నిమగ్నమైన అభ్యాస అనుభవాన్ని అందించడానికి రూపొందించబడింది.',
    home_step1_title: 'ఒక కార్యక్రమాన్ని ఎంచుకోండి', home_step1_desc: 'మా విస్తృత కేటలాగ్‌ను బ్రౌజ్ చేయండి మరియు మీ లక్ష్యాలకు అనుగుణంగా ఉన్న కోర్సును కనుగొనండి.',
    home_step2_title: 'మీ వేగంలో నేర్చుకోండి', home_step2_desc: 'అధిక-నాణ్యత వీడియో లెక్చర్లు, పఠన సామగ్రి మరియు ఇంటరాక్టివ్ క్విజ్‌లను ఎప్పుడైనా యాక్సెస్ చేయండి.',
    home_step3_title: 'సర్టిఫికేషన్ పొందండి', home_step3_desc: 'పాఠ్యప్రణాళికను పూర్తి చేసి ప్రపంచవ్యాప్తంగా గుర్తింపు పొందిన పూర్తి సర్టిఫికేట్ పొందండి.',
    home_completed: 'పూర్తయింది', home_lessons: '100+ పాఠాలు',
    // Home - Why choose us
    home_why_title: 'SDF ని ఎందుకు ఎంచుకోవాలి?',
    home_why1_title: 'నిపుణ గురువులు', home_why1_desc: 'ప్రాచీన ఆరోగ్య సంప్రదాయాలలో దశాబ్దాల అనుభవం ఉన్న అత్యంత అర్హులైన అభ్యాసకుల నుండి నేర్చుకోండి.',
    home_why2_title: 'ఎక్కడైనా నేర్చుకోండి', home_why2_desc: 'ప్రపంచంలో ఎక్కడ నుండైనా, ఏ పరికరంలోనైనా, మీ స్వంత వేగంలో అధిక-నాణ్యత కోర్సులను యాక్సెస్ చేయండి.',
    home_why3_title: 'సర్టిఫైడ్ అభ్యాసం', home_why3_desc: 'మీ నైపుణ్యాలు మరియు జ్ఞానాన్ని ధృవీకరించడానికి కోర్సు పూర్తిపై గుర్తింపు పొందిన సర్టిఫికేట్లు పొందండి.',
    // Home - CTA
    home_cta_title: 'అభ్యాసం ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?',
    home_cta_sub: 'ఇప్పటికే మాతో నేర్చుకుంటున్న వేల మంది విద్యార్థులతో చేరండి. మీ ప్రయాణాన్ని ఈరోజే ప్రారంభించండి!',
    home_cta_btn: 'ఇప్పుడే ప్రారంభించండి',
    home_view_all_mobile: 'అన్ని కోర్సులు చూడండి',

    // CTA
    cta_title: 'అభ్యాసం ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?',
    cta_sub: 'యోగ, ధ్యానం మరియు ఆయుర్వేదం యొక్క ప్రాచీన జ్ఞానం ద్వారా తమ జీవితాలను మార్చుకున్న వేల మంది విద్యార్థులతో చేరండి.',
    cta_btn: 'ఈరోజే నమోదు చేసుకోండి',

    // Footer
    footer_desc: 'స్వామి ద్విజ ఫౌండేషన్ లెర్నింగ్ మేనేజ్‌మెంట్ సిస్టమ్. మా ప్రీమియం యోగ, ధ్యానం, పోషణ మరియు ఆయుర్వేద కోర్సులతో మీ ఆరోగ్య ప్రయాణం ప్రారంభించండి.',
    footer_quick: 'త్వరిత లింకులు', footer_legal: 'చట్టపరమైనది',
    footer_privacy: 'గోప్యతా విధానం', footer_terms: 'సేవా నిబంధనలు',
    footer_copy: 'స్వామి ద్విజ ఫౌండేషన్. అన్ని హక్కులు మేము కలిగి ఉన్నాము.',

    // Dashboard Nav
    dash_nav_home: 'హోమ్',
    dash_nav_courses: 'కోర్సులు',
    dash_nav_classes: 'తరగతులు',
    dash_nav_learning: 'నా అభ్యాసం',
    dash_nav_profile: 'ప్రొఫైల్',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('app_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('app_language', newLang);
    } catch (e) {
      console.error('Error saving language:', e);
    }
  };

  const t = (key) => {
    if (!key) return '';
    const currentDict = translations[lang] || translations['en'];
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    return translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// ─── Auto-translate hook for dynamic DB content ───────────────────────────────
// When lang is 'en', ALWAYS returns the English text.
// When lang is 'te', uses preTranslated field (e.g. title_te from DB) or fetches Telugu translation.
export const useAutoTranslate = (text, preTranslated = '') => {
  const { lang } = useLanguage();
  const [result, setResult] = useState(lang === 'te' ? (preTranslated || text || '') : (text || ''));

  useEffect(() => {
    // If English or no text, always return English
    if (lang !== 'te') {
      setResult(text || '');
      return;
    }

    // If Telugu mode:
    // 1. If preTranslated exists (e.g. title_te from DB), use it
    if (preTranslated) {
      setResult(preTranslated);
      return;
    }

    if (!text) {
      setResult('');
      return;
    }

    // 2. Check localStorage cache
    const CACHE_KEY = 'sdf_te_cache_v1';
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch {}

    if (cache[text]) {
      setResult(cache[text]);
      return;
    }

    // 3. Fetch from MyMemory API for Telugu translation
    const controller = new AbortController();
    fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|te`,
      { signal: controller.signal }
    )
      .then(r => r.json())
      .then(data => {
        if (data.responseStatus === 200) {
          const translated = data.responseData.translatedText;
          try {
            cache[text] = translated;
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
          } catch {}
          setResult(translated);
        }
      })
      .catch(() => {
        setResult(text || '');
      });

    return () => controller.abort();
  }, [text, lang, preTranslated]);

  return result;
};
