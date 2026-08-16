import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-inter bg-bg-cream">
      <PublicNavbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Simple Footer for Public Pages */}
      <footer className="bg-dark-bg text-white py-12 border-t border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <img src="/logo.png" alt="SDF Logo" className="h-12 w-auto mb-6 bg-white/10 p-2 rounded-lg" />
              <p className="text-gray-400 font-outfit max-w-sm">
                Swamy Dwija Foundation Learning Management System. Start your wellness journey with our premium Yoga, Meditation, Nutrition, and Ayurveda courses.
              </p>
            </div>
            <div>
              <h4 className="font-outfit font-semibold text-lg mb-4 text-brand-green">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 font-outfit">
                <li><a href="/" className="hover:text-brand-orange transition-colors">Home</a></li>
                <li><a href="/about" className="hover:text-brand-orange transition-colors">About Us</a></li>
                <li><a href="/courses" className="hover:text-brand-orange transition-colors">Courses</a></li>
                <li><a href="/contact" className="hover:text-brand-orange transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-outfit font-semibold text-lg mb-4 text-brand-green">Legal</h4>
              <ul className="space-y-2 text-gray-400 font-outfit">
                <li><a href="#" className="hover:text-brand-orange transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 font-outfit text-sm">
            <p>&copy; {new Date().getFullYear()} Swamy Dwija Foundation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
