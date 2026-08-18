import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import { useLanguage } from '../../context/LanguageContext';

const PublicLayout = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col font-inter bg-bg-cream">
      <PublicNavbar />
      
      {/* Main Content Area — offset for fixed top navbar (mobile ~104px, desktop ~120px) and mobile bottom nav */}
      <main className="flex-grow pt-28 md:pt-32 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Simple Footer for Public Pages */}
      <footer className="bg-dark-bg text-white py-12 border-t border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <img src="/logo.png" alt="SDF Logo" className="h-12 w-auto mb-6 bg-white/10 p-2 rounded-lg" />
              <p className="text-gray-400 font-outfit max-w-sm">
                {t('footer_desc')}
              </p>
            </div>
            <div>
              <h4 className="font-outfit font-semibold text-lg mb-4 text-brand-green">{t('footer_quick')}</h4>
              <ul className="space-y-2 text-gray-400 font-outfit">
                <li><a href="/" className="hover:text-brand-orange transition-colors">{t('nav_home')}</a></li>
                <li><a href="/about" className="hover:text-brand-orange transition-colors">{t('nav_about')}</a></li>
                <li><a href="/courses" className="hover:text-brand-orange transition-colors">{t('nav_courses')}</a></li>
                <li><a href="/contact" className="hover:text-brand-orange transition-colors">{t('nav_contact')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-outfit font-semibold text-lg mb-4 text-brand-green">{t('footer_legal')}</h4>
              <ul className="space-y-2 text-gray-400 font-outfit">
                <li><a href="#" className="hover:text-brand-orange transition-colors">{t('footer_privacy')}</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">{t('footer_terms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 font-outfit text-sm">
            <p>&copy; {new Date().getFullYear()} {t('footer_copy')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
