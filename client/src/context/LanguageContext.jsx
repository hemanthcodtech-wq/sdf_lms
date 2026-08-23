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
    about_title: 'Swami Dwija Foundation',
    about_subtitle: 'Swami Dwija Foundation is dedicated to sharing the timeless wisdom of Indian culture and traditions to inspire a healthier, wiser, and more meaningful life.',
    about_tagline_badge: 'Bridging Ancient Heritage & Modern Living',
    about_core_quote_title: 'Modern + Traditional',
    about_core_quote: '“Bridging the wisdom of our ancient Indian traditions with the needs of modern life to nurture healthier bodies, wiser minds, and meaningful living.”',
    about_philosophy_badge: 'Our Philosophy & Synthesis',
    about_philosophy_heading: 'Why Modern + Traditional?',
    about_philosophy_desc: 'In today’s fast-paced world, stress, mental fatigue, and lifestyle imbalances are pervasive. Ancient Indian sciences—Yoga, Pranayama, Dhyana, Ayurveda, and Vedic philosophy—are not outdated rituals, but sophisticated, time-tested systems designed for human flourishing. We bridge this profound heritage with modern lifestyles, making wellness practical, accessible, and transformational.',
    
    about_pillar1_title: 'Ancient Roots (Shastras)',
    about_pillar1_desc: 'Direct teachings from classical scriptures including the Patanjali Yoga Sutras, Hatha Yoga Pradipika, and Ayurvedic texts, preserved with pure authenticity.',
    about_pillar2_title: 'Modern Context & Science',
    about_pillar2_desc: 'Translating timeless principles into evidence-based routines, anatomical safety, and flexible schedules suited for modern professionals and families.',
    about_pillar3_title: 'Holistic Transformation',
    about_pillar3_desc: 'Nurturing the whole human being—uniting physical vitality (Sharira), mental stillness (Manas), and spiritual awareness (Atman).',
    about_pillar4_title: 'Inclusive Global Sangha',
    about_pillar4_desc: 'Democratizing authentic spiritual education to learners across cultures, ages, and backgrounds through world-class digital learning.',

    mission_title: 'Our Sacred Mission',
    mission_p1: 'To impart authentic, life-transforming education in Indian traditions, classical Yoga, and Vedic wisdom to empower every individual to live with vitality, clarity, and purpose.',
    mission_p2: 'By synthesizing ancestral disciplines with contemporary understanding, we equip seekers to master stress, prevent chronic imbalances, and unlock their highest potential.',
    
    vision_title: 'Our Vision',
    vision_p1: 'A world where the timeless wisdom of Indian culture guides global humanity toward harmonious living, mental peace, and holistic longevity.',
    vision_p2: 'The Swami Dwija Foundation aspires to be a premier global beacon where seekers discover their authentic self and cultivate a truly meaningful existence.',

    about_values_badge: 'Guiding Principles',
    about_values_title: 'Core Values We Uphold',
    val_authenticity: 'Authenticity (Satya)',
    val_authenticity_desc: 'Honoring original lineage traditions and scriptures without dilution or commercial compromise.',
    val_community: 'Compassion & Community (Karuna)',
    val_community_desc: 'Creating an encouraging, inclusive sanctuary where every student is nurtured and supported.',
    val_excellence: 'Mastery & Lineage (Guru Parampara)',
    val_excellence_desc: 'Guided by deeply dedicated practitioners and gurus possessing experiential wisdom and sadhana.',
    val_holism: 'Holistic Harmony (Samagra)',
    val_holism_desc: 'Unifying breath, movement, nutrition, and meditative awareness into one seamless life practice.',
    val_accessibility: 'Global Inclusivity (Sarvajanina)',
    val_accessibility_desc: 'Making classical wellness available to everyone through accessible digital tools and community outreach.',
    val_service: 'Selfless Service (Seva)',
    val_service_desc: 'Sharing knowledge as a sacred duty to uplift individuals, families, and society at large.',

    about_verticals_badge: 'Curriculum & Disciplines',
    about_verticals_title: 'The Four Pillars of Living Wisdom',
    vert_yoga_title: 'Classical Yoga & Asanas',
    vert_yoga_desc: 'Mindful posture alignments, restorative sequences, and physical energy balancing.',
    vert_prana_title: 'Pranayama & Breath Alchemy',
    vert_prana_desc: 'Ancient breathwork techniques to regulate the nervous system and revitalize life-force energy.',
    vert_ayur_title: 'Ayurveda & Conscious Nutrition',
    vert_ayur_desc: 'Personalized dinacharya routines, seasonal lifestyle wisdom, and sattvic nutritional balance.',
    vert_dhyana_title: 'Meditation & Vedic Mind Sciences',
    vert_dhyana_desc: 'Guided Dhyana, sound vibration, and self-inquiry for unshakeable inner peace and clarity.',

    about_founder_badge: 'Founder\'s Message',
    about_founder_quote: '“True education is not merely learning facts, but igniting the divine wisdom within. Our mission at Swami Dwija Foundation is to return the sacred gift of our ancestors into your everyday life.”',
    about_founder_role: 'Spiritual Guide & Founder, Swami Dwija Foundation',
    about_cta_title: 'Begin Your Path to Holistic Well-Being',
    about_cta_sub: 'Experience the life-changing synthesis of ancient traditions and modern vitality. Join thousands of dedicated learners today.',
    about_cta_btn1: 'Explore Our Courses',
    about_cta_btn2: 'Connect With Us',

    // Contact
    contact_title: 'Get In Touch',
    contact_subtitle: "We'd love to hear from you. Drop us a message!",
    contact_info: 'Contact Information',
    contact_call: 'Call Us', contact_email_us: 'Email Us',
    contact_location_label: 'Location',
    contact_location_val: 'B Block - 505, Northface Grandeur Apartments, Opposite Ayyappa Swamy Temple, Gollapudi, NTR District, Andhra Pradesh - 521225',
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
    about_title: 'స్వామి ద్విజ ఫౌండేషన్',
    about_subtitle: 'ఆరోగ్యకరమైన, జ్ఞానవంతమైన మరియు మరింత అర్థవంతమైన జీవితాన్ని ప్రేరేపించడానికి భారతీయ సంస్కృతి మరియు సంప్రదాయాల శాశ్వత జ్ఞానాన్ని అందించడానికి స్వామి ద్విజ ఫౌండేషన్ అంకితమైంది.',
    about_tagline_badge: 'ప్రాచీన సంప్రదాయం & ఆధునిక జీవన విధానం',
    about_core_quote_title: 'ఆధునిక + సాంప్రదాయక సమన్వయం',
    about_core_quote: '“ఆరోగ్యకరమైన శరీరం, వివేకవంతమైన మనస్సు మరియు అర్థవంతమైన జీవనాన్ని పెంపొందించడానికి మన ప్రాచీన భారతీయ సంప్రదాయాల జ్ఞానాన్ని ఆధునిక జీవిత అవసరాలతో సమన్వయం చేయడం.”',
    about_philosophy_badge: 'మా తత్వశాస్త్రం & సమన్వయం',
    about_philosophy_heading: 'ఆధునిక + సాంప్రదాయక ఎందుకు?',
    about_philosophy_desc: 'నేటి వేగవంతమైన ప్రపంచంలో ఒత్తిడి, మానసిక అలసట మరియు జీవనశైలి అసమతుల్యతలు సర్వసాధారణం. ప్రాచీన భారతీయ శాస్త్రాలు — యోగ, ప్రాణాయామం, ధ్యానం, ఆయుర్వేదం మరియు వేద తత్వశాస్త్రం — కేవలం ఆచారాలు కావు, మానవాళి శ్రేయస్సు కోసం రూపొందించిన కాలాతీత విజ్ఞానం. మేము ఈ లోతైన వారసత్వాన్ని ఆధునిక జీవనశైలితో అనుసంధానించి, సంపూర్ణ ఆరోగ్యాన్ని ఆచరణాత్మకంగా అందిస్తున్నాము.',
    
    about_pillar1_title: 'ప్రాచీన మూలాలు (శాస్త్రాలు)',
    about_pillar1_desc: 'పతంజలి యోగ సూత్రాలు, హఠయోగ ప్రదీపిక మరియు ఆయుర్వేద గ్రంథాల నుండి స్వచ్ఛమైన ప్రామాణికతతో బోధనలు.',
    about_pillar2_title: 'ఆధునిక సందర్భం & సైన్స్',
    about_pillar2_desc: 'శాశ్వత సూత్రాలను శాస్త్రీయ దృక్పథంతో ఆధునిక ఉద్యోగులు మరియు కుటుంబాలకు సరిపోయే సులభమైన దినచర్యలుగా మార్చడం.',
    about_pillar3_title: 'సంపూర్ణ పరివర్తన',
    about_pillar3_desc: 'శారీరక బలం (శరీర), మానసిక ప్రశాంతత (మనస్సు) మరియు ఆత్మ జాగృతిని ఏకం చేసి సమగ్ర వికాసం సాధించడం.',
    about_pillar4_title: 'సమగ్ర ప్రపంచ సమాజం',
    about_pillar4_desc: 'అంతర్జాతీయ డిజిటల్ లెర్నింగ్ ద్వారా అన్ని వయసుల వారికి మరియు ప్రపంచవ్యాప్త అభ్యాసకులకు ప్రామాణిక విద్యను అందించడం.',

    mission_title: 'మా పవిత్ర లక్ష్యం',
    mission_p1: 'భారతీయ సంప్రదాయాలు, యోగ మరియు వేద విజ్ఞానంలో ప్రామాణికమైన విద్యను అందించి, ప్రతి వ్యక్తి ఉత్సాహం, స్పష్టత మరియు లక్ష్యంతో జీవించేలా శక్తినివ్వడం మా లక్ష్యం.',
    mission_p2: 'ప్రాచీన క్రమశిక్షణను సమకాలీన అవగాహనతో మిళితం చేయడం ద్వారా, ఒత్తిడిని నియంత్రించి, అంతర్గత శక్తిని మేల్కొలిపే సాధనలను అందిస్తున్నాము.',
    
    vision_title: 'మా దృష్టి',
    vision_p1: 'భారతీయ సంస్కృతి యొక్క శాశ్వత జ్ఞానం ప్రపంచ మానవాళిని సమన్వయ జీవనం, మానసిక శాంతి మరియు దీర్ఘాయువు వైపు నడిపించే ప్రపంచాన్ని మేము ఊహిస్తున్నాము.',
    vision_p2: 'స్వామి ద్విజ ఫౌండేషన్ ప్రతి సాధకుడు తన నిజమైన స్వరూపాన్ని కనుగొని, అర్థవంతమైన జీవితాన్ని గడిపే అంతర్జాతీయ కేంద్రంగా ఉండాలని ఆకాంక్షిస్తోంది.',

    about_values_badge: 'మా మార్గదర్శక సూత్రాలు',
    about_values_title: 'మేము విశ్వసించే మూల విలువలు',
    val_authenticity: 'ప్రామాణికత (సత్యం)',
    val_authenticity_desc: 'మూల గ్రంథాలు మరియు గురు పరంపర యొక్క నిబద్ధతను పరిరక్షించడం.',
    val_community: 'కరుణ & సంఘం (కరుణ)',
    val_community_desc: 'ప్రతి అభ్యాసకుడిని ఆదరించి ప్రోత్సహించే సహాయక వాతావరణాన్ని అందించడం.',
    val_excellence: 'గురు పరంపర & శ్రేష్ఠత',
    val_excellence_desc: 'లోతైన అనుభవం మరియు సాధన ఉన్న నిపుణ గురువులచే ప్రత్యక్ష మార్గదర్శకత్వం.',
    val_holism: 'సమగ్ర ఆరోగ్యం (సమగ్ర)',
    val_holism_desc: 'శ్వాస, వ్యాయామం, ఆహారం మరియు ధ్యానాన్ని ఏకం చేసే సంపూర్ణ జీవన విధానం.',
    val_accessibility: 'సార్వజనీన లభ్యత',
    val_accessibility_desc: 'డిజిటల్ సాధనాల ద్వారా ప్రతి ఒక్కరికీ సంక్షేమ విద్యను అందుబాటులో ఉంచడం.',
    val_service: 'నిస్వార్థ సేవ (సేవ)',
    val_service_desc: 'వ్యక్తులను, కుటుంబాలను మరియు సమాజాన్ని ఉన్నతీకరించే పవిత్ర కర్తవ్యంగా జ్ఞానాన్ని పంచడం.',

    about_verticals_badge: 'పాఠ్యప్రణాళిక & విభాగాలు',
    about_verticals_title: 'జీవన జ్ఞానానికి నాలుగు స్తంభాలు',
    vert_yoga_title: 'క్లాసికల్ యోగ & ఆసనాలు',
    vert_yoga_desc: 'సరైన భంగిమలు, పునరుజ్జీవన క్రమాలు మరియు శారీరక శక్తి సమతుల్యత.',
    vert_prana_title: 'ప్రాణాయామం & శ్వాస విజ్ఞానం',
    vert_prana_desc: 'నాడీ వ్యవస్థను క్రమబద్ధీకరించడానికి మరియు ప్రాణశక్తిని పెంచడానికి ప్రాచీన శ్వాస పద్ధతులు.',
    vert_ayur_title: 'ఆయుర్వేదం & సత్వ ఆహారం',
    vert_ayur_desc: 'వ్యక్తిగత దినచర్య, ఋతుచర్య మరియు సాత్విక పోషకాహార సమతుల్యత.',
    vert_dhyana_title: 'ధ్యానం & వేద మనోవిజ్ఞానం',
    vert_dhyana_desc: 'స్థిరమైన మానసిక శాంతి మరియు స్పష్టత కోసం మార్గదర్శక ధ్యానం మరియు మంత్ర సాధన.',

    about_founder_badge: 'వ్యవస్థాపకుల సందేశం',
    about_founder_quote: '“నిజమైన విద్య కేవలం విషయాలను నేర్చుకోవడం కాదు, మనలోని దైవిక జ్ఞానాన్ని వెలిగించడం. మన పూర్వీకుల పవిత్ర కానుకను మీ దైనందిన జీవితంలోకి తీసుకురావడమే స్వామి ద్విజ ఫౌండేషన్ లక్ష్యం.”',
    about_founder_role: 'ఆధ్యాత్మిక మార్గదర్శకులు & వ్యవస్థాపకులు, స్వామి ద్విజ ఫౌండేషన్',
    about_cta_title: 'సంపూర్ణ ఆరోగ్య ప్రయాణాన్ని ప్రారంభించండి',
    about_cta_sub: 'ప్రాచీన సంప్రదాయాలు మరియు ఆధునిక ఆరోగ్యం యొక్క అద్భుత సమన్వయాన్ని అనుభవించండి. వేలాది మంది అభ్యాసకులతో చేరండి.',
    about_cta_btn1: 'కోర్సులను చూడండి',
    about_cta_btn2: 'మాతో సంప్రదించండి',

    // Contact
    contact_title: 'సంప్రదించండి',
    contact_subtitle: 'మీరు చెప్పేది వినడానికి ఇష్టపడతాము. మాకు సందేశం పంపండి!',
    contact_info: 'సంప్రదింపు సమాచారం',
    contact_call: 'కాల్ చేయండి', contact_email_us: 'ఇమెయిల్ చేయండి',
    contact_location_label: 'చిరునామా',
    contact_location_val: 'బి బ్లాక్ - 505, నార్త్‌ఫేస్ గ్రాండ్యూర్ అపార్ట్‌మెంట్స్, అయ్యప్ప స్వామి ఆలయం ఎదురుగా, గొల్లపూడి, ఎన్టీఆర్ జిల్లా, ఆంధ్రప్రదేశ్ - 521225',
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
