import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const FooterLinks: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme } = useTheme();
  
  return (
    <footer className={`flex flex-wrap justify-center gap-4 text-xs mt-8 ${className} ${
      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
    }`}>
      <a href="#" className="hover:underline">Privacy Policy</a>
      <span>|</span>
      <a href="#" className="hover:underline">Terms of Service</a>
      <span>|</span>
      <a href="#" className="hover:underline">Help</a>
    </footer>
  );
};

export default FooterLinks; 