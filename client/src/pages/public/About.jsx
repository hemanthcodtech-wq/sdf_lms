import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-bg-cream pb-12 overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-outfit text-gray-900 mb-6">{t('about_title')}</h1>
          <div className="w-24 h-1 bg-brand-green mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 font-inter max-w-3xl mx-auto leading-relaxed">
            {t('about_subtitle')}
          </p>
        </motion.div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-orange/20 rounded-3xl transform -rotate-6 scale-105"></div>
            <img src="https://images.unsplash.com/photo-1599447421416-3414500d18a5?q=80&w=2070&auto=format&fit=crop" alt="Meditation" className="relative z-10 rounded-3xl shadow-xl w-full h-auto object-cover" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold font-outfit text-gray-900 mb-6">{t('mission_title')}</h2>
            <p className="text-gray-600 font-inter text-lg mb-6 leading-relaxed">
              {t('mission_p1')}
            </p>
            <p className="text-gray-600 font-inter text-lg leading-relaxed">
              {t('mission_p2')}
            </p>
          </motion.div>
        </div>

        {/* Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold font-outfit text-gray-900 mb-6">{t('vision_title')}</h2>
            <p className="text-gray-600 font-inter text-lg mb-6 leading-relaxed">
              {t('vision_p1')}
            </p>
            <p className="text-gray-600 font-inter text-lg leading-relaxed">
              {t('vision_p2')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-brand-green/20 rounded-3xl transform rotate-6 scale-105"></div>
            <img src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2070&auto=format&fit=crop" alt="Vision" className="relative z-10 rounded-3xl shadow-xl w-full h-auto object-cover" />
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-brand-green text-white rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div>
              <h3 className="text-2xl font-bold font-outfit mb-4">{t('val_authenticity')}</h3>
              <p className="font-inter text-green-50 opacity-90">{t('val_authenticity_desc')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-outfit mb-4">{t('val_community')}</h3>
              <p className="font-inter text-green-50 opacity-90">{t('val_community_desc')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-outfit mb-4">{t('val_excellence')}</h3>
              <p className="font-inter text-green-50 opacity-90">{t('val_excellence_desc')}</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default About;
