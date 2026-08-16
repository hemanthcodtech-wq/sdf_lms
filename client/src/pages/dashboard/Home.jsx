import React from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaLeaf, FaSeedling, FaSpa, FaAppleAlt } from 'react-icons/fa';

const categories = [
  { name: 'Yoga', icon: FaSpa, color: 'bg-[#0a4f2a]' },
  { name: 'Meditation', icon: FaSeedling, color: 'bg-[#297838]' },
  { name: 'Nutrition', icon: FaAppleAlt, color: 'bg-[#d67b22]' },

  { name: 'Ayurveda', icon: FaLeaf, color: 'bg-[#70a448]' },
];

const Home = () => {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const displayName = user?.emailOrPhone?.split('@')[0] || 'Guest';

  return (
    <div className="px-5 md:px-10 lg:px-24 pt-8 md:pt-16 max-w-screen-2xl mx-auto flex flex-col items-center">
      <div className="w-full max-w-6xl">

      
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="flex justify-between items-start mb-8 md:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 capitalize">Hello, {displayName} <span className="text-xl">👋</span></h1>
          <p className="text-sm text-gray-600 mt-2 font-medium max-w-[220px]">Ready to begin your wellness journey today?</p>
        </div>
        <button className="p-2 text-gray-600 hover:text-brand-green bg-white rounded-full shadow-sm relative">
          <FaBell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* Desktop Header Greeting */}
      <div className="hidden md:block mb-10 w-full text-center md:text-left">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-4xl lg:text-5xl font-bold text-gray-800 capitalize"
        >
          Welcome back, {displayName} <span className="text-3xl inline-block origin-bottom-right hover:animate-wave">👋</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg lg:text-xl text-gray-600 mt-3 font-medium"
        >
          Ready to begin your wellness journey today?
        </motion.p>
      </div>

      {/* Main Content Grid for Desktop */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Left Column (Featured + Categories) */}
        <div className="flex-1 w-full space-y-8 lg:space-y-12">
          
          {/* Featured Class Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="relative w-full h-[220px] md:h-[300px] lg:h-[340px] rounded-3xl overflow-hidden shadow-lg group hover:shadow-2xl transition-shadow duration-500"
          >
            <img 
              src="/images/yoga_stress.png" 
              alt="Yoga for Stress Relief" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#eef2dc]/90 via-[#eef2dc]/70 to-transparent"></div>
            
            <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center">
              <span className="text-brand-green-dark font-bold text-sm md:text-base tracking-wide uppercase mb-2">Featured Class</span>
              <h2 className="text-2xl md:text-4xl font-bold text-[#1a2f23] max-w-[200px] md:max-w-[300px] leading-tight mb-4 md:mb-8">
                Yoga for Stress Relief
              </h2>
              <button className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2.5 md:py-3 px-6 md:px-8 rounded-full shadow-md w-max transition-colors">
                Join Now
              </button>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-between md:justify-start md:gap-12 w-full px-2 md:px-0"
          >
            {categories.map((category, index) => (
              <motion.div 
                key={category.name}
                whileHover={{ y: -5, scale: 1.05 }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full ${category.color} text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
                  <category.icon size={28} className="md:w-10 md:h-10" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-800">{category.name}</span>
              </motion.div>
            ))}
          </motion.div>
          
        </div>

        {/* Right Column (Continue Learning) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full lg:w-[400px]"
        >
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg md:text-xl font-bold text-gray-800">Continue Learning</h3>
            <a href="#" className="text-brand-green font-semibold text-sm hover:underline">View All</a>
          </div>

          {/* Horizontal Card */}
          <div className="bg-white rounded-3xl p-3 flex gap-4 items-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shrink-0">
              <img 
                src="/images/morning_yoga.png" 
                alt="Morning Yoga Flow" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 pr-4">
              <h4 className="font-bold text-gray-800 text-[15px] md:text-base leading-tight mb-1">Morning Yoga Flow</h4>
              <p className="text-xs text-gray-500 mb-4">Beginner Level</p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs font-bold text-gray-800">60%</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
      </div>
    </div>
  );
};

export default Home;
