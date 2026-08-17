import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaClock, FaGlobe, FaStar, FaArrowRight, FaCheckCircle, FaAward, FaChalkboardTeacher, FaGraduationCap, FaLeaf, FaHeartbeat, FaOm, FaAppleAlt, FaQuoteLeft, FaPlayCircle } from 'react-icons/fa';
// --- Typewriter Component ---
const TypewriterText = ({ text }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i > text.length) clearInterval(intervalId);
    }, 100);
    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayText}<span className="animate-pulse">|</span></span>;
};

// --- Animated Counter Component ---
const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = "" }) => {
  const nodeRef = React.useRef(null);
  const inView = React.useRef(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          inView.current = true;
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (hasAnimated && nodeRef.current) {
      // Basic count up animation
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentVal = Math.floor(easeProgress * (to - from) + from);

        if (nodeRef.current) {
          nodeRef.current.textContent = currentVal + suffix;
        }

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [from, to, duration, suffix, hasAnimated]);

  return <span ref={nodeRef}>{from}{suffix}</span>;
};

// --- Tilted Card Component ---
const TiltedCard = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="tilted-card-wrapper w-full h-full cursor-pointer" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className={`w-full h-full relative ${className}`}>
        {children}
      </motion.div>
    </div>
  );
};

const Home = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public`);
        setFeaturedCourses(data.data.slice(0, 4)); // Get top 4 courses
      } catch (error) {
        console.error('Error fetching featured courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const partners = [
    "Yoga Alliance", "Ayurvedic Medical Board", "Global Wellness Inst.", "Mindfulness Assoc.",
    "Health & Harmony", "Sattva Foundation", "Prana Systems", "Vedanta Society",
    "Yoga Alliance", "Ayurvedic Medical Board", "Global Wellness Inst.", "Mindfulness Assoc." // Duplicated for seamless marquee
  ];

  return (
    <div className="bg-bg-cream overflow-hidden">

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-dark-bg">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/90 via-[#084223]/80 to-[#ea7a28]/60 z-0"></div>

        {/* Transparent Logo in Background */}
        <img src="/logo.png" alt="SDF Logo Background" className="absolute top-24 right-8 w-48 md:w-72 opacity-[0.08] z-0 filter mix-blend-plus-lighter" />

        <motion.div style={{ y: y1 }} className="absolute top-20 -left-20 w-96 h-96 bg-brand-green/30 rounded-full blur-[100px] animate-pulse-slow z-0" />
        <motion.div style={{ y: y2 }} className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-orange/30 rounded-full blur-[100px] animate-float z-0" style={{ animationDelay: '2s' }} />

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-green/20 via-transparent to-transparent rounded-full mix-blend-overlay filter blur-[120px] opacity-40 animate-pulse-slow z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-outfit text-white mb-6 drop-shadow-2xl tracking-tight">
              Future of <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-green via-yellow-400 to-brand-orange bg-[length:200%_auto] animate-text-shimmer drop-shadow-lg">
                <TypewriterText text="Wellness Learning" />
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100/80 font-inter mb-10 max-w-3xl mx-auto font-light">
              Master new skills in a premium, immersive environment. Join the Swamy Dwija Foundation's community of visionaries.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/courses" className="group relative overflow-hidden bg-brand-green text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-green-dark transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(13,92,49,0.5)] inline-flex items-center justify-center border border-brand-green/50">
                <span className="relative z-10 flex items-center">
                  Explore Courses
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-text-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
              </Link>
              <Link to="/register" className="glass text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300 transform hover:scale-105 shadow-lg border border-white/20">
                Start Learning
              </Link>
            </div>

            {/* Stats Glass Cards */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up">
              <div className="p-6 rounded-2xl glass hover:bg-white/10 transition-colors border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                  <AnimatedCounter from={0} to={10} suffix="K+" duration={2.5} />
                </div>
                <div className="text-blue-200/70 font-medium tracking-wide uppercase text-sm">Students</div>
              </div>
              <div className="p-6 rounded-2xl glass hover:bg-white/10 transition-colors border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                  <AnimatedCounter from={0} to={50} suffix="+" duration={2} />
                </div>
                <div className="text-blue-200/70 font-medium tracking-wide uppercase text-sm">Courses</div>
              </div>
              <div className="p-6 rounded-2xl glass hover:bg-white/10 transition-colors border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                  <AnimatedCounter from={0} to={20} suffix="+" duration={2} />
                </div>
                <div className="text-blue-200/70 font-medium tracking-wide uppercase text-sm">Instructors</div>
              </div>
              <div className="p-6 rounded-2xl glass hover:bg-white/10 transition-colors border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
                  <AnimatedCounter from={0} to={99} suffix="%" duration={2.5} />
                </div>
                <div className="text-blue-200/70 font-medium tracking-wide uppercase text-sm">Satisfaction</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- PARTNERS MARQUEE --- */}
      <section className="py-8 bg-white border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Trusted by industry leaders worldwide</p>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center py-4">
            {partners.map((partner, index) => (
              <span key={index} className="mx-8 text-xl font-bold text-gray-300 hover:text-brand-green transition-colors cursor-pointer">
                {partner}
              </span>
            ))}
          </div>
          {/* Duplicate for seamless effect */}
          <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center py-4" style={{ left: '100%' }}>
            {partners.map((partner, index) => (
              <span key={`dup-${index}`} className="mx-8 text-xl font-bold text-gray-300 hover:text-brand-green transition-colors cursor-pointer">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED COURSES (TILTED CARDS) --- */}
      <section className="py-24 relative bg-bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-2 font-outfit">Featured Courses</h2>
              <p className="text-gray-500 font-medium text-lg">Discover our most popular wellness programs</p>
            </div>
            <Link to="/courses" className="hidden md:flex items-center text-brand-green font-bold hover:text-brand-green-dark transition-colors">
              View All <FaArrowRight className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12"><div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredCourses.map((course, idx) => (
                <TiltedCard key={course._id} className="bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col h-full transform-gpu transition-all duration-200">
                  <div className="w-full h-48 rounded-[1.5rem] overflow-hidden mb-6 relative bg-gray-100 shadow-inner" style={{ transform: "translateZ(30px)" }}>
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-green/50 bg-brand-green/10 font-bold">No Image</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-brand-green shadow-sm">
                      {course.category}
                    </div>
                  </div>

                  <div style={{ transform: "translateZ(40px)" }} className="flex-1 flex flex-col">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2 font-outfit line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                        <span className="flex items-center gap-1.5"><FaClock className="text-brand-green" /> {course.duration}</span>
                        <span className="flex items-center gap-1.5 text-orange-500"><FaStar /> 4.9</span>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xl font-black text-gray-900">₹{course.price}</span>
                        <button onClick={() => navigate(`/courses/${course.slug}`)} className="text-brand-green font-bold hover:text-brand-green-dark text-sm bg-brand-green/10 px-4 py-2 rounded-full transition-colors">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </TiltedCard>
              ))}
            </div>
          )}

          <div className="md:hidden text-center mt-10">
            <Link to="/courses" className="inline-flex items-center text-brand-green font-bold hover:text-brand-green-dark transition-colors">
              View All Courses <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- CATEGORIES SECTION --- */}
      <section className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 font-outfit">Explore by Category</h2>
            <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">Find the perfect path for your wellness journey from our diverse range of subjects.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Yoga', icon: <FaOm />, color: 'bg-orange-100 text-orange-600', hover: 'hover:bg-orange-600 hover:text-white' },
              { name: 'Meditation', icon: <FaLeaf />, color: 'bg-green-100 text-green-600', hover: 'hover:bg-green-600 hover:text-white' },
              { name: 'Ayurveda', icon: <FaHeartbeat />, color: 'bg-red-100 text-red-600', hover: 'hover:bg-red-600 hover:text-white' },
              { name: 'Nutrition', icon: <FaAppleAlt />, color: 'bg-blue-100 text-blue-600', hover: 'hover:bg-blue-600 hover:text-white' }
            ].map((cat, idx) => (
              <div key={idx} className={`rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 transform hover:-translate-y-2 shadow-sm border border-gray-100 group ${cat.color} ${cat.hover}`}>
                <div className="text-4xl mb-4 transition-transform group-hover:scale-110">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold font-outfit">{cat.name}</h3>
                <p className="mt-2 text-sm opacity-80 group-hover:opacity-100">View Courses</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="py-24 relative bg-bg-cream overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop" alt="Learning" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-brand-green/20 mix-blend-overlay"></div>
                <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white text-3xl hover:bg-white hover:text-brand-green transition-all duration-300 shadow-lg group">
                  <FaPlayCircle className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl hidden lg:block animate-float">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-brand-green text-xl">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Completed</p>
                    <p className="text-lg font-bold text-gray-900">100+ Lessons</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6 font-outfit">How You'll Learn</h2>
              <p className="text-lg text-gray-600 mb-10">Our platform is designed to provide a seamless, intuitive, and deeply engaging learning experience.</p>
              
              <div className="space-y-8">
                {[
                  { title: "Select a Program", desc: "Browse our extensive catalog and find the course that resonates with your goals." },
                  { title: "Learn at Your Pace", desc: "Access high-quality video lectures, reading materials, and interactive quizzes anytime." },
                  { title: "Earn Certification", desc: "Complete the curriculum and receive a globally recognized certificate of completion." }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-brand-green text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-brand-green/30">
                        {idx + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* --- WHY CHOOSE US (NEOMORPHISM) --- */}
      <section className="py-24 relative bg-bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16 text-gray-900 font-outfit">Why Choose SDF?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="neomorph p-10 rounded-[2rem] text-center transition-all duration-300 hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 neomorph-inset rounded-full flex items-center justify-center text-brand-green text-3xl">
                  <FaChalkboardTeacher />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 font-outfit">Expert Gurus</h3>
              <p className="text-gray-600 font-medium leading-relaxed">Learn from highly qualified practitioners with decades of experience in ancient wellness traditions.</p>
            </div>

            <div className="neomorph p-10 rounded-[2rem] text-center transition-all duration-300 hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 neomorph-inset rounded-full flex items-center justify-center text-brand-orange text-3xl">
                  <FaGlobe />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 font-outfit">Learn Anywhere</h3>
              <p className="text-gray-600 font-medium leading-relaxed">Access high-quality courses on any device, at your own pace, from anywhere in the world.</p>
            </div>

            <div className="neomorph p-10 rounded-[2rem] text-center transition-all duration-300 hover:-translate-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 neomorph-inset rounded-full flex items-center justify-center text-brand-green text-3xl">
                  <FaAward />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 font-outfit">Certified Learning</h3>
              <p className="text-gray-600 font-medium leading-relaxed">Earn recognized certificates upon course completion to validate your skills and knowledge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="py-24 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 font-outfit">Student Success Stories</h2>
            <p className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">Hear from our community of learners who have transformed their lives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'Yoga Instructor', text: 'The Foundations of Vinyasa Yoga course completely changed my approach to teaching. The depth of knowledge provided is unmatched.', img: 'https://i.pravatar.cc/150?img=1' },
              { name: 'Michael Chen', role: 'Wellness Coach', text: 'Ayurvedic Diet & Nutrition gave me the practical tools I needed to help my clients achieve better health outcomes.', img: 'https://i.pravatar.cc/150?img=11' },
              { name: 'Elena Rodriguez', role: 'Meditation Practitioner', text: 'Advanced Mindfulness Meditation helped me deepen my practice and find a level of peace I didn\'t know was possible.', img: 'https://i.pravatar.cc/150?img=5' }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-bg-cream rounded-[2rem] p-8 relative shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <FaQuoteLeft className="text-4xl text-brand-green/20 absolute top-8 right-8" />
                <div className="flex items-center gap-4 mb-6">
                  <img src={testimonial.img} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 relative overflow-hidden bg-brand-green-dark">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/50 to-brand-orange/20 backdrop-blur-[2px]"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white font-outfit drop-shadow-lg">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100/90 mb-10 font-medium">Join thousands of students already learning with us. Start your journey today!</p>
          <Link to="/register" className="inline-block bg-white text-brand-green px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            Get Started Now
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
