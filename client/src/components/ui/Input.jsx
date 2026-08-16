import React from 'react';
import { motion } from 'framer-motion';

const Input = ({ label, type = 'text', placeholder, icon: Icon, ...props }) => {
  return (
    <div className="w-full mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/50 transition-all duration-300 backdrop-blur-sm shadow-sm"
          {...props}
        />
        {Icon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
