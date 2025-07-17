import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const AuthHeader: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className="flex flex-col items-center gap-2 animate-fade-in">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
        theme === 'dark' ? 'bg-primary-600' : 'bg-primary-500'
      }`}>
        {/* Logo */}
        <img src="/Logo.png" alt="ORJ Logo" className="w-8 h-8 rounded-full" />
      </div>
      <h1 className={`text-3xl font-bold ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Sign in to your account</h1>
      <p className={`text-base text-center ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>Please enter your details to sign in and start collaborating.</p>
    </div>
  );
};

export default AuthHeader; 