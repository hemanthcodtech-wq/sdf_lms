import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FaSpa, FaLeaf, FaHeart, FaAward, FaUsers, FaGlobe, 
  FaBookOpen, FaHandsHelping, FaOm, FaShieldAlt, FaArrowRight,
  FaCheckCircle, FaSun, FaMoon, FaBrain, FaWind
} from 'react-icons/fa';
import { GiMeditation, GiLotus, GiYinYang } from 'react-icons/gi';

const About = () => {
  const { t } = useLanguage();

  const [siteStats, setSiteStats] = useState({
    studentsCount: 5000,
    studentsSuffix: '+',
    studentsLabel: 'Transformed Seekers',
    coursesCount: 25,
    coursesSuffix: '+',
    coursesLabel: 'Master Curricula',
    lineageRate: 100,
    lineageSuffix: '%',
    lineageLabel: 'Authentic Vedic Lineage',
    communitiesCount: 15,
    communitiesSuffix: '+',
    communitiesLabel: 'Global Communities'
  });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/stats`)
      .then(res => {
        if (res.data.success && res.data.data) {
          setSiteStats(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const stats = [
    { value: `${siteStats.studentsCount?.toLocaleString('en-IN') || '5,000'}${siteStats.studentsSuffix || '+'}`, label: siteStats.studentsLabel || 'Transformed Seekers', icon: FaUsers },
    { value: `${siteStats.coursesCount || '25'}${siteStats.coursesSuffix || '+'}`, label: siteStats.coursesLabel || 'Master Curricula', icon: FaBookOpen },
    { value: `${siteStats.lineageRate || '100'}${siteStats.lineageSuffix || '%'}`, label: siteStats.lineageLabel || 'Authentic Vedic Lineage', icon: FaAward },
    { value: `${siteStats.communitiesCount || '15'}${siteStats.communitiesSuffix || '+'}`, label: siteStats.communitiesLabel || 'Global Communities', icon: FaGlobe }
  ];

  const pillars = [
    {
      title: t('about_pillar1_title'),
      desc: t('about_pillar1_desc'),
      icon: FaBookOpen,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-700 border-amber-200'
    },
    {
      title: t('about_pillar2_title'),
      desc: t('about_pillar2_desc'),
      icon: FaBrain,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-800 border-emerald-200'
    },
    {
      title: t('about_pillar3_title'),
      desc: t('about_pillar3_desc'),
      icon: GiYinYang,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-800 border-blue-200'
    },
    {
      title: t('about_pillar4_title'),
      desc: t('about_pillar4_desc'),
      icon: FaGlobe,
      color: 'from-purple-500/10 to-rose-500/10 text-purple-800 border-purple-200'
    }
  ];

  const verticals = [
    {
      title: t('vert_yoga_title'),
      desc: t('vert_yoga_desc'),
      icon: GiMeditation,
      bg: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: t('vert_prana_title'),
      desc: t('vert_prana_desc'),
      icon: FaWind,
      bg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: t('vert_ayur_title'),
      desc: t('vert_ayur_desc'),
      icon: FaLeaf,
      bg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: t('vert_dhyana_title'),
      desc: t('vert_dhyana_desc'),
      icon: GiLotus,
      bg: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?q=80&w=800&auto=format&fit=crop'
    }
  ];

  const values = [
    { title: t('val_authenticity'), desc: t('val_authenticity_desc'), icon: FaShieldAlt },
    { title: t('val_community'), desc: t('val_community_desc'), icon: FaHeart },
    { title: t('val_excellence'), desc: t('val_excellence_desc'), icon: FaAward },
    { title: t('val_holism'), desc: t('val_holism_desc'), icon: FaSpa },
    { title: t('val_accessibility'), desc: t('val_accessibility_desc'), icon: FaGlobe },
    { title: t('val_service'), desc: t('val_service_desc'), icon: FaHandsHelping }
  ];

  return (
    <div className="bg-[#FAF7F2] text-gray-800 font-inter min-h-screen overflow-hidden">
      
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-brand-green/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-40 left-10 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green-dark text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 shadow-xs"
          >
            <GiLotus className="text-amber-600 text-base animate-pulse" />
            <span>{t('about_tagline_badge')}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black font-outfit text-gray-900 tracking-tight leading-tight max-w-5xl mx-auto"
          >
            {t('about_title')}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-32 h-1.5 bg-gradient-to-r from-amber-500 via-brand-green to-emerald-600 mx-auto rounded-full my-6"
          />

          {/* Subtitle Statement */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-2xl text-gray-700 font-medium max-w-4xl mx-auto leading-relaxed"
          >
            {t('about_subtitle')}
          </motion.p>

          {/* 🌟 Modern + Traditional Core Quote Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-12 max-w-4xl mx-auto bg-white/85 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] border-2 border-amber-400/60 shadow-[0_20px_50px_rgba(10,79,42,0.08)] relative overflow-hidden text-center group hover:border-amber-500 transition-all"
          >
            {/* Watermark Logo */}
            <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none text-brand-green">
              <FaOm size={240} />
            </div>

            <div className="relative z-10 space-y-4">
              <span className="inline-block px-3.5 py-1 bg-amber-50 border border-amber-300/80 rounded-full text-amber-900 font-black text-xs uppercase tracking-widest">
                ✨ {t('about_core_quote_title')}
              </span>
              
              <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif italic font-bold text-brand-green-dark leading-relaxed">
                {t('about_core_quote')}
              </blockquote>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span className="w-8 h-px bg-amber-400"></span>
                <span>Swamy Dwija Foundation Guiding Philosophy</span>
                <span className="w-8 h-px bg-amber-400"></span>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-5xl mx-auto"
          >
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/90 shadow-sm flex flex-col items-center justify-center text-center hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-xl mb-3">
                    <Icon />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 font-outfit">{stat.value}</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">{stat.label}</span>
                </div>
              );
            })}
          </motion.div>

        </div>
      </section>

      {/* ─── Modern + Traditional Synthesis Section ──────────────── */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-100/80 px-3.5 py-1 rounded-full mb-3">
              <GiYinYang /> {t('about_philosophy_badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-gray-900 tracking-tight">
              {t('about_philosophy_heading')}
            </h2>
            <div className="w-20 h-1 bg-brand-green mx-auto rounded-full my-4"></div>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              {t('about_philosophy_desc')}
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`bg-gradient-to-br ${pillar.color} p-7 rounded-[2rem] border shadow-xs hover:shadow-lg transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center text-2xl mb-5">
                      <Icon />
                    </div>
                    <h3 className="text-xl font-bold font-outfit text-gray-900 mb-3">{pillar.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{pillar.desc}</p>
                  </div>
                  <div className="pt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-green-dark">
                    <FaCheckCircle className="text-amber-500" /> Living Vedic Standard
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── Mission & Vision Visual Storytelling ─────────────────── */}
      <section className="py-20 lg:py-28 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            
            {/* Mission Card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-gray-100 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -z-0"></div>
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider">
                  <FaSun /> Purpose & Action
                </div>
                <h3 className="text-3xl sm:text-4xl font-black font-outfit text-gray-900">
                  {t('mission_title')}
                </h3>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-normal">
                  {t('mission_p1')}
                </p>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-normal">
                  {t('mission_p2')}
                </p>
              </div>

              <div className="relative z-10 pt-8 mt-6 border-t border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
                  <FaSpa />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Empowering Everyday Sadhana</h4>
                  <p className="text-xs text-gray-500">Accessible wellness practices crafted for daily modern life.</p>
                </div>
              </div>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-brand-green text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 text-yellow-300 rounded-full text-xs font-black uppercase tracking-wider">
                  <FaMoon /> Global Aspiration
                </div>
                <h3 className="text-3xl sm:text-4xl font-black font-outfit text-white">
                  {t('vision_title')}
                </h3>
                <p className="text-green-50/90 text-base sm:text-lg leading-relaxed font-normal">
                  {t('vision_p1')}
                </p>
                <p className="text-green-50/90 text-base sm:text-lg leading-relaxed font-normal">
                  {t('vision_p2')}
                </p>
              </div>

              <div className="relative z-10 pt-8 mt-6 border-t border-white/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-yellow-300 flex items-center justify-center text-xl shrink-0">
                  <FaGlobe />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">A Beacon of Global Harmony</h4>
                  <p className="text-xs text-green-100/80">Connecting ancient heritage with global consciousness.</p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ─── The Four Verticals of Living Wisdom ─────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-brand-green-dark bg-brand-green/10 px-3.5 py-1 rounded-full mb-3">
              <GiLotus /> {t('about_verticals_badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-gray-900 tracking-tight">
              {t('about_verticals_title')}
            </h2>
            <div className="w-20 h-1 bg-amber-500 mx-auto rounded-full my-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {verticals.map((vert, idx) => {
              const Icon = vert.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative rounded-[2rem] overflow-hidden shadow-lg h-96 flex flex-col justify-end p-6 border border-gray-200 cursor-pointer"
                >
                  <img 
                    src={vert.bg} 
                    alt={vert.title}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-amber-300 flex items-center justify-center text-2xl border border-white/30 mb-2">
                      <Icon />
                    </div>
                    <h3 className="text-xl font-bold font-outfit text-white">{vert.title}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{vert.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── Guiding Values & Principles ─────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full mb-3">
              <FaShieldAlt /> {t('about_values_badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-gray-900 tracking-tight">
              {t('about_values_title')}
            </h2>
            <div className="w-20 h-1 bg-brand-green mx-auto rounded-full my-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="bg-white p-8 rounded-[2rem] shadow-xs border border-gray-100 hover:shadow-xl hover:border-brand-green/30 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green-dark group-hover:bg-brand-green group-hover:text-white flex items-center justify-center text-2xl transition-all">
                      <Icon />
                    </div>
                    <h3 className="text-xl font-bold font-outfit text-gray-900">{val.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{val.desc}</p>
                  </div>
                  <div className="pt-6 mt-4 border-t border-gray-100 text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                    SDF Foundation Pillar
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ─── Founder's Sacred Message Section ────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#FAF7F2] to-amber-50/60 p-8 sm:p-12 rounded-[2.5rem] border-2 border-amber-300/80 shadow-md flex flex-col sm:flex-row items-center gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-brand-green text-amber-300 flex items-center justify-center text-5xl shadow-xl shrink-0 border-4 border-white">
              <FaOm />
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-amber-800 bg-amber-200/60 px-3 py-1 rounded-full">
                {t('about_founder_badge')}
              </span>
              <blockquote className="text-lg sm:text-xl font-serif italic text-gray-800 font-semibold leading-relaxed">
                {t('about_founder_quote')}
              </blockquote>
              <p className="text-xs font-bold text-brand-green uppercase tracking-wider">
                {t('about_founder_role')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Call to Action (CTA) ─────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-brand-green text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black font-outfit tracking-tight">
            {t('about_cta_title')}
          </h2>
          <p className="text-base sm:text-xl text-green-100 max-w-2xl mx-auto leading-relaxed">
            {t('about_cta_sub')}
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/courses"
              className="px-8 py-4 bg-white text-brand-green-dark hover:bg-yellow-300 hover:text-gray-900 font-extrabold rounded-2xl text-sm sm:text-base shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span>{t('about_cta_btn1')}</span>
              <FaArrowRight size={13} />
            </Link>

            <Link
              to="/contact"
              className="px-8 py-4 bg-brand-green-dark hover:bg-black/30 text-white border border-white/30 font-bold rounded-2xl text-sm sm:text-base transition-all"
            >
              {t('about_cta_btn2')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
